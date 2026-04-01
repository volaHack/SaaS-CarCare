package com.ecofleet.service;

import com.ecofleet.model.*;
import com.ecofleet.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.YearMonth;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.TextStyle;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

@Service
public class ReporteService {

    private static final Logger log = LoggerFactory.getLogger(ReporteService.class);

    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private VehiculoRepository vehiculoRepository;
    @Autowired private RutaRepository rutaRepository;
    @Autowired private RepostajeRepository repostajeRepository;
    @Autowired private MantenimientoPreventivoRepository preventivosRepo;
    @Autowired private MantenimientoCorrectivoRepository correctivosRepo;
    @Autowired private ConfiguracionEmailRepository configEmailRepo;
    @Autowired private EmailService emailService;

    @Scheduled(cron = "0 0 8 1 * *")
    public void enviarReportesMensuales() {
        log.info("Iniciando envío de reportes mensuales automáticos...");
        List<Usuario> admins = usuarioRepository.findByRole("ADMIN");
        for (Usuario admin : admins) {
            try {
                enviarReporte(admin.getId(), LocalDate.now(), true);
            } catch (Exception e) {
                log.error("Error enviando reporte a {}: {}", admin.getEmail(), e.getMessage());
            }
        }
        log.info("Reportes mensuales enviados a {} empresas.", admins.size());
    }

    public void enviarReporte(String empresaId) throws Exception {
        enviarReporte(empresaId, LocalDate.now(), false);
    }

    void enviarReporte(String empresaId, LocalDate fechaBase, boolean cierreMensual) throws Exception {
        Usuario admin = usuarioRepository.findById(empresaId)
                .orElseThrow(() -> new IllegalArgumentException("Empresa no encontrada"));

        ConfiguracionEmail cfg = configEmailRepo.findByEmpresaId(empresaId).orElse(null);

        YearMonth periodo = cierreMensual
                ? YearMonth.from(fechaBase.minusMonths(1))
                : YearMonth.from(fechaBase);
        int year  = periodo.getYear();
        int month = periodo.getMonthValue();
        String mesNombre = periodo.getMonth().getDisplayName(TextStyle.FULL, new Locale("es", "ES"));
        mesNombre = mesNombre.substring(0, 1).toUpperCase() + mesNombre.substring(1);

        List<Vehiculo> vehiculos = vehiculoRepository.findByUsuarioId(empresaId);
        long totalVehiculos   = vehiculos.size();
        long vehiculosActivos = vehiculos.stream().filter(v -> Boolean.TRUE.equals(v.getActivo())).count();

        List<String> vehiculoIds = vehiculos.stream().map(Vehiculo::getId).collect(Collectors.toList());

        List<Ruta> todasRutas = rutaRepository.findByUsuarioId(empresaId);
        List<Ruta> rutasMes   = todasRutas.stream()
                .filter(r -> perteneceAlPeriodo(r.getFecha(), periodo))
                .collect(Collectors.toList());
        long rutasCompletadas = rutasMes.stream()
                .filter(r -> "COMPLETADA".equals(normalizarEstado(r.getEstado())))
                .count();
        long rutasTotal       = rutasMes.size();
        double kmTotales      = rutasMes.stream()
                .filter(r -> "COMPLETADA".equals(normalizarEstado(r.getEstado())) && r.getDistanciaEstimadaKm() != null)
                .mapToDouble(Ruta::getDistanciaEstimadaKm).sum();

        double litrosTotales = 0, costeCombustible = 0;
        for (String vid : vehiculoIds) {
            for (Repostaje r : repostajeRepository.findByVehiculoId(vid)) {
                if (r.getFecha() != null && r.getFecha().getYear() == year && r.getFecha().getMonthValue() == month) {
                    litrosTotales    += r.getLitros()     != null ? r.getLitros()     : 0;
                    costeCombustible += r.getCosteTotal() != null ? r.getCosteTotal() : 0;
                }
            }
        }

        double costeMantenimiento = 0;
        int totalMantenimientos   = 0;
        for (String vid : vehiculoIds) {
            for (MantenimientoPreventivo mp : preventivosRepo.findByVehiculoIdOrderByFechaDesc(vid)) {
                if (mp.getFecha() != null && mp.getFecha().getYear() == year && mp.getFecha().getMonthValue() == month) {
                    costeMantenimiento += mp.getCosto() != null ? mp.getCosto() : 0;
                    totalMantenimientos++;
                }
            }
            for (MantenimientoCorrectivo mc : correctivosRepo.findByVehiculoIdOrderByFechaDesc(vid)) {
                if (mc.getFecha() != null && mc.getFecha().getYear() == year && mc.getFecha().getMonthValue() == month) {
                    costeMantenimiento += mc.getCosto() != null ? mc.getCosto() : 0;
                    totalMantenimientos++;
                }
            }
        }

        double costeTotal = costeCombustible + costeMantenimiento;

        String emailDestino = (cfg != null && cfg.getEmailNotificaciones() != null && !cfg.getEmailNotificaciones().isBlank())
                ? cfg.getEmailNotificaciones()
                : admin.getEmail();

        String html = buildHtml(
                admin.getNombreEmpresa() != null ? admin.getNombreEmpresa() : admin.getNombre(),
                mesNombre, year,
                totalVehiculos, vehiculosActivos,
                rutasTotal, rutasCompletadas,
                kmTotales,
                litrosTotales, costeCombustible,
                totalMantenimientos, costeMantenimiento,
                costeTotal
        );

        String subject = "Reporte Mensual CarCare - " + mesNombre + " " + year;
        emailService.enviar(emailDestino, subject, html);
        log.info("Reporte mensual enviado a {} ({}) para {}-{}: vehiculos={}, rutasPlanificadas={}, rutasCompletadas={}",
                emailDestino, empresaId, year, month, totalVehiculos, rutasTotal, rutasCompletadas);
    }

    // ─── Template HTML — dark theme acorde al dashboard CarCare ──────────────
    private String buildHtml(String empresa, String mes, int year,
                             long totalVeh, long activosVeh,
                             long rutasTot, long rutasComp,
                             double km,
                             double litros, double costeComb,
                             int mantenTotal, double costeMant,
                             double costeTotal) {
        String pct = rutasTot > 0
                ? String.format("%.0f%%", (rutasComp * 100.0 / rutasTot))
                : "-";

        return "<!DOCTYPE html><html lang='es'><head><meta charset='UTF-8'>" +
               "<meta name='viewport' content='width=device-width,initial-scale=1'></head>" +
               "<body style='margin:0;padding:0;background:#080c14;font-family:Segoe UI,Roboto,Arial,sans-serif;'>" +

               // ── Outer container
               "<table width='100%' cellpadding='0' cellspacing='0' style='background:#080c14;'><tr><td align='center'>" +
               "<table width='600' cellpadding='0' cellspacing='0' style='max-width:600px;width:100%;'>" +

               // ── HEADER ─────────────────────────────────────────────────────
               "<tr><td style='background:linear-gradient(135deg,#0f1923 0%,#0d1117 100%);padding:48px 40px 36px;text-align:center;border-bottom:2px solid #3bf63b;'>" +
               "<div style='margin-bottom:20px;'>" +
               "<span style='display:inline-block;font-size:28px;font-weight:800;letter-spacing:3px;color:#3bf63b;'>./CarCare</span>" +
               "</div>" +
               "<h1 style='color:#ffffff;margin:0 0 8px;font-size:22px;font-weight:700;letter-spacing:0.5px;'>Reporte Mensual de Flota</h1>" +
               "<p style='color:rgba(255,255,255,0.45);margin:0;font-size:14px;'>" + mes + " " + year + "</p>" +
               "</td></tr>" +

               // ── EMPRESA BAR ────────────────────────────────────────────────
               "<tr><td style='background:#0f1923;padding:16px 40px;border-bottom:1px solid rgba(255,255,255,0.06);'>" +
               "<table width='100%' cellpadding='0' cellspacing='0'><tr>" +
               "<td style='color:rgba(255,255,255,0.4);font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1.5px;'>Empresa</td>" +
               "<td align='right' style='color:#ffffff;font-size:14px;font-weight:700;'>" + empresa + "</td>" +
               "</tr></table>" +
               "</td></tr>" +

               // ── BODY ───────────────────────────────────────────────────────
               "<tr><td style='background:#0d1117;padding:32px 28px;'>" +

               // Intro
               "<p style='color:rgba(255,255,255,0.6);font-size:14px;line-height:1.7;margin:0 0 28px;'>" +
               "Aqui tenes el resumen de actividad de tu flota durante <span style='color:#3bf63b;font-weight:600;'>" + mes + " " + year + "</span>.</p>" +

               // ── KPI Row 1: Vehiculos + Rutas
               "<table width='100%' cellpadding='0' cellspacing='0' style='margin-bottom:12px;'><tr>" +
               "<td width='49%' valign='top'>" + kpiCard("VEHICULOS", totalVeh + " total", activosVeh + " activos", "#3bf63b") + "</td>" +
               "<td width='2%'></td>" +
               "<td width='49%' valign='top'>" + kpiCard("RUTAS", rutasTot + " planificadas", rutasComp + " completadas (" + pct + ")", "#22c55e") + "</td>" +
               "</tr></table>" +

               // ── KPI Row 2: Km + Combustible
               "<table width='100%' cellpadding='0' cellspacing='0' style='margin-bottom:12px;'><tr>" +
               "<td width='49%' valign='top'>" + kpiCard("KILOMETROS", String.format("%.0f km", km), "recorridos este mes", "#60a5fa") + "</td>" +
               "<td width='2%'></td>" +
               "<td width='49%' valign='top'>" + kpiCard("COMBUSTIBLE", String.format("%.1f L", litros), String.format("%.2f EUR", costeComb), "#f59e0b") + "</td>" +
               "</tr></table>" +

               // ── KPI Row 3: Mantenimientos + Coste Total
               "<table width='100%' cellpadding='0' cellspacing='0' style='margin-bottom:8px;'><tr>" +
               "<td width='49%' valign='top'>" + kpiCard("MANTENIMIENTOS", mantenTotal + " registros", String.format("%.2f EUR", costeMant), "#ef4444") + "</td>" +
               "<td width='2%'></td>" +
               "<td width='49%' valign='top'>" + kpiCard("COSTE TOTAL", String.format("%.2f EUR", costeTotal), "combustible + mant.", "#a78bfa") + "</td>" +
               "</tr></table>" +

               "</td></tr>" +

               // ── FOOTER ─────────────────────────────────────────────────────
               "<tr><td style='background:#0a0e18;padding:28px 40px;text-align:center;border-top:1px solid rgba(255,255,255,0.06);'>" +
               "<p style='color:rgba(255,255,255,0.25);font-size:12px;margin:0 0 6px;'>Reporte generado automaticamente por <span style='color:#3bf63b;'>CarCare</span></p>" +
               "<p style='color:rgba(255,255,255,0.15);font-size:11px;margin:0;'>" + year + " CarCare Tracker - Gestion Inteligente de Flotas</p>" +
               "</td></tr>" +

               "</table></td></tr></table>" +
               "</body></html>";
    }

    private String kpiCard(String label, String value, String sub, String accentColor) {
        return "<div style='background:#0f1923;border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:18px 16px;'>" +
               "<div style='font-size:10px;font-weight:700;color:" + accentColor + ";text-transform:uppercase;letter-spacing:1.5px;margin-bottom:10px;'>" + label + "</div>" +
               "<div style='font-size:22px;font-weight:800;color:#ffffff;margin-bottom:4px;letter-spacing:-0.5px;'>" + value + "</div>" +
               "<div style='font-size:12px;color:rgba(255,255,255,0.4);'>" + sub + "</div>" +
               "</div>";
    }

    private boolean perteneceAlPeriodo(String fechaRuta, YearMonth periodo) {
        LocalDate fecha = parseRutaFecha(fechaRuta);
        return fecha != null && YearMonth.from(fecha).equals(periodo);
    }

    private LocalDate parseRutaFecha(String fechaRuta) {
        if (fechaRuta == null || fechaRuta.isBlank()) {
            return null;
        }

        String valor = fechaRuta.trim();

        LocalDate fecha = parseLocalDate(valor);
        if (fecha != null) {
            return fecha;
        }

        int separadorFechaHora = valor.indexOf('T');
        if (separadorFechaHora > 0) {
            fecha = parseLocalDate(valor.substring(0, separadorFechaHora));
            if (fecha != null) {
                return fecha;
            }
        }

        try {
            return OffsetDateTime.parse(valor).toLocalDate();
        } catch (DateTimeParseException ignored) {
        }

        try {
            return ZonedDateTime.parse(valor).toLocalDate();
        } catch (DateTimeParseException ignored) {
        }

        try {
            return Instant.parse(valor).atZone(ZoneId.systemDefault()).toLocalDate();
        } catch (DateTimeParseException ignored) {
        }

        log.warn("No se pudo interpretar la fecha de la ruta para el reporte mensual: {}", fechaRuta);
        return null;
    }

    private LocalDate parseLocalDate(String valor) {
        try {
            return LocalDate.parse(valor, DateTimeFormatter.ISO_LOCAL_DATE);
        } catch (DateTimeParseException ignored) {
        }

        try {
            return LocalDate.parse(valor, DateTimeFormatter.ofPattern("yyyy-M-d"));
        } catch (DateTimeParseException ignored) {
        }

        return null;
    }

    private String normalizarEstado(String estado) {
        return estado == null ? "" : estado.trim().toUpperCase(Locale.ROOT);
    }
}
