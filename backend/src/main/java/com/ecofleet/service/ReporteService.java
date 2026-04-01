package com.ecofleet.service;

import com.ecofleet.model.*;
import com.ecofleet.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.TextStyle;
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
                enviarReporte(admin.getId());
            } catch (Exception e) {
                log.error("Error enviando reporte a {}: {}", admin.getEmail(), e.getMessage());
            }
        }
        log.info("Reportes mensuales enviados a {} empresas.", admins.size());
    }

    public void enviarReporte(String empresaId) throws Exception {
        Usuario admin = usuarioRepository.findById(empresaId)
                .orElseThrow(() -> new IllegalArgumentException("Empresa no encontrada"));

        ConfiguracionEmail cfg = configEmailRepo.findByEmpresaId(empresaId).orElse(null);
        if (cfg == null || cfg.getResendApiKey() == null || cfg.getResendApiKey().isBlank()) {
            throw new IllegalStateException("Email no configurado. Configurá la API Key de Resend desde Ajustes en el dashboard.");
        }

        LocalDate hoy = LocalDate.now();
        LocalDate mesRef = hoy.getDayOfMonth() == 1 ? hoy.minusMonths(1) : hoy;
        int year  = mesRef.getYear();
        int month = mesRef.getMonthValue();
        String mesNombre = mesRef.getMonth().getDisplayName(TextStyle.FULL, new Locale("es", "ES"));
        mesNombre = mesNombre.substring(0, 1).toUpperCase() + mesNombre.substring(1);
        String yearMonthPrefix = String.format("%d-%02d", year, month);

        // ── Datos ─────────────────────────────────────────────────────────────
        List<Vehiculo> vehiculos = vehiculoRepository.findByUsuarioId(empresaId);
        long totalVehiculos   = vehiculos.size();
        long vehiculosActivos = vehiculos.stream().filter(v -> Boolean.TRUE.equals(v.getActivo())).count();

        List<String> vehiculoIds = vehiculos.stream().map(Vehiculo::getId).collect(Collectors.toList());

        List<Ruta> todasRutas = rutaRepository.findByUsuarioId(empresaId);
        List<Ruta> rutasMes   = todasRutas.stream()
                .filter(r -> r.getFecha() != null && r.getFecha().startsWith(yearMonthPrefix))
                .collect(Collectors.toList());
        long rutasCompletadas = rutasMes.stream().filter(r -> "COMPLETADA".equals(r.getEstado())).count();
        long rutasTotal       = rutasMes.size();
        double kmTotales      = rutasMes.stream()
                .filter(r -> "COMPLETADA".equals(r.getEstado()) && r.getDistanciaEstimadaKm() != null)
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

        String emailDestino = (cfg.getEmailNotificaciones() != null && !cfg.getEmailNotificaciones().isBlank())
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
        emailService.enviar(cfg.getResendApiKey(), emailDestino, subject, html);
        log.info("Reporte mensual enviado a {} ({})", emailDestino, empresaId);
    }

    // ─── Template HTML ────────────────────────────────────────────────────────
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
               "<meta name='viewport' content='width=device-width,initial-scale=1'>" +
               "<title>Reporte Mensual CarCare</title></head>" +
               "<body style='margin:0;padding:0;background:#f0f2f5;font-family:Segoe UI,Arial,sans-serif;'>" +
               "<div style='background:linear-gradient(135deg,#1a1f2e 0%,#0d1117 100%);padding:40px 32px 32px;text-align:center;'>" +
               "<div style='display:inline-block;background:rgba(255,255,255,0.1);border-radius:12px;padding:10px 20px;margin-bottom:16px;'>" +
               "<span style='color:#60a5fa;font-size:14px;font-weight:700;letter-spacing:2px;'>CARCARE</span></div>" +
               "<h1 style='color:#fff;margin:0 0 6px;font-size:26px;font-weight:700;'>Reporte Mensual de Flota</h1>" +
               "<p style='color:rgba(255,255,255,0.55);margin:0;font-size:15px;'>" + mes + " " + year + " - " + empresa + "</p>" +
               "</div>" +
               "<div style='max-width:600px;margin:0 auto;padding:32px 16px 48px;'>" +
               "<p style='color:#374151;font-size:15px;line-height:1.6;margin-bottom:28px;'>" +
               "Hola, aqui tenes el resumen de actividad de tu flota durante <strong>" + mes + " " + year + "</strong>.</p>" +
               "<div style='display:flex;gap:16px;margin-bottom:16px;flex-wrap:wrap;'>" +
               kpiCard("Vehiculos", totalVeh + " total", activosVeh + " activos", "#3b82f6") +
               kpiCard("Rutas", rutasTot + " planificadas", rutasComp + " completadas (" + pct + ")", "#10b981") +
               "</div>" +
               "<div style='display:flex;gap:16px;margin-bottom:16px;flex-wrap:wrap;'>" +
               kpiCard("Kilometros", String.format("%.0f km", km), "rutas completadas", "#8b5cf6") +
               kpiCard("Combustible", String.format("%.1f L", litros), String.format("%.2f EUR coste", costeComb), "#f59e0b") +
               "</div>" +
               "<div style='display:flex;gap:16px;margin-bottom:28px;flex-wrap:wrap;'>" +
               kpiCard("Mantenimientos", mantenTotal + " registros", String.format("%.2f EUR coste", costeMant), "#ef4444") +
               kpiCard("Coste Total", String.format("%.2f EUR", costeTotal), "comb. + mantenimiento", "#6366f1") +
               "</div>" +
               "<hr style='border:none;border-top:1px solid #e5e7eb;margin:0 0 24px;'/>" +
               "<p style='color:#6b7280;font-size:13px;text-align:center;line-height:1.6;'>" +
               "Este reporte fue generado automaticamente por <strong>CarCare</strong>.</p>" +
               "</div>" +
               "<div style='background:#1a1f2e;padding:20px;text-align:center;'>" +
               "<p style='color:rgba(255,255,255,0.3);font-size:12px;margin:0;'>" + year + " CarCare - Gestion Inteligente de Flotas</p>" +
               "</div>" +
               "</body></html>";
    }

    private String kpiCard(String label, String value, String sub, String color) {
        return "<div style='flex:1;min-width:220px;background:#fff;border-radius:12px;" +
               "padding:20px;box-shadow:0 1px 4px rgba(0,0,0,0.07);" +
               "border-left:4px solid " + color + ";'>" +
               "<div style='font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;" +
               "letter-spacing:1px;margin-bottom:4px;'>" + label + "</div>" +
               "<div style='font-size:20px;font-weight:700;color:#111827;margin-bottom:2px;'>" + value + "</div>" +
               "<div style='font-size:13px;color:#6b7280;'>" + sub + "</div>" +
               "</div>";
    }
}
