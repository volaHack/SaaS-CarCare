package com.ecofleet.service;

import com.ecofleet.model.Usuario;
import com.ecofleet.model.Vehiculo;
import com.ecofleet.repository.UsuarioRepository;
import com.ecofleet.repository.VehiculoRepository;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class AlertaMantenimientoService {

    private static final Logger logger = LoggerFactory.getLogger(AlertaMantenimientoService.class);
    private static final int[] DIAS_ALERTA = {30, 7, 1};

    @Autowired
    private JavaMailSender mailSender;

    @Autowired
    private VehiculoRepository vehiculoRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Value("${spring.mail.username:}")
    private String remitente;

    /**
     * Se ejecuta cada día a las 9:00 AM.
     */
    @Scheduled(cron = "0 0 9 * * *")
    public void verificarAlertas() {
        if (remitente == null || remitente.isBlank()) {
            logger.warn("GMAIL_USER no configurado — alertas de mantenimiento desactivadas.");
            return;
        }

        logger.info("═══ VERIFICANDO ALERTAS DE MANTENIMIENTO ═══");
        LocalDate hoy = LocalDate.now();

        List<Vehiculo> todos = vehiculoRepository.findAll();
        for (Vehiculo v : todos) {
            if (v.getUsuarioId() == null) continue;

            Optional<Usuario> adminOpt = usuarioRepository.findById(v.getUsuarioId());
            if (adminOpt.isEmpty() || adminOpt.get().getEmail() == null) continue;

            String emailAdmin = adminOpt.get().getEmail();
            List<AlertaItem> alertas = new ArrayList<>();

            checkFecha(v.getFechaITV(),          "ITV",               v, hoy, alertas);
            checkFecha(v.getFechaSeguro(),        "Seguro",            v, hoy, alertas);
            checkFecha(v.getFechaRevision(),      "Revisión General",  v, hoy, alertas);
            checkFecha(v.getFechaCambioAceite(),  "Cambio de Aceite",  v, hoy, alertas);

            if (!alertas.isEmpty()) {
                try {
                    enviarEmail(emailAdmin, v, alertas);
                    logger.info("✓ Alerta enviada a {} para vehículo {}", emailAdmin, v.getMatricula());
                } catch (Exception e) {
                    logger.error("Error enviando alerta a {}: {}", emailAdmin, e.getMessage());
                }
            }
        }
    }

    private void checkFecha(String fechaStr, String tipo, Vehiculo v, LocalDate hoy, List<AlertaItem> alertas) {
        if (fechaStr == null || fechaStr.isBlank()) return;
        try {
            LocalDate fecha = LocalDate.parse(fechaStr, DateTimeFormatter.ISO_LOCAL_DATE);
            long diasRestantes = ChronoUnit.DAYS.between(hoy, fecha);

            for (int umbral : DIAS_ALERTA) {
                if (diasRestantes == umbral) {
                    alertas.add(new AlertaItem(tipo, fecha, diasRestantes));
                    return;
                }
            }
            // También alertar si ya venció (días negativos hasta -7)
            if (diasRestantes < 0 && diasRestantes >= -7 && diasRestantes % 7 == 0) {
                alertas.add(new AlertaItem(tipo, fecha, diasRestantes));
            }
        } catch (Exception e) {
            logger.warn("Fecha inválida para {} vehículo {}: {}", tipo, v.getMatricula(), fechaStr);
        }
    }

    private void enviarEmail(String destinatario, Vehiculo v, List<AlertaItem> alertas) throws Exception {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

        helper.setFrom(remitente, "CarCare Tracker");
        helper.setTo(destinatario);
        helper.setSubject("🚗 Alerta de Mantenimiento — " + v.getMarca() + " " + v.getModelo() + " (" + v.getMatricula() + ")");
        helper.setText(buildHtml(v, alertas), true);

        mailSender.send(message);
    }

    private String buildHtml(Vehiculo v, List<AlertaItem> alertas) {
        StringBuilder items = new StringBuilder();
        for (AlertaItem a : alertas) {
            String color = a.diasRestantes <= 1 ? "#ef4444"
                         : a.diasRestantes <= 7 ? "#f97316"
                         : "#f59e0b";
            String label = a.diasRestantes < 0
                ? "⚠️ Venció hace " + Math.abs(a.diasRestantes) + " días"
                : a.diasRestantes == 0 ? "🚨 ¡Vence HOY!"
                : a.diasRestantes == 1 ? "🔴 Vence MAÑANA"
                : "⏰ Vence en " + a.diasRestantes + " días";

            items.append("""
                <tr>
                  <td style="padding:12px 16px;border-bottom:1px solid #1e293b;">
                    <strong style="color:#e2e8f0;">%s</strong>
                  </td>
                  <td style="padding:12px 16px;border-bottom:1px solid #1e293b;color:#94a3b8;">%s</td>
                  <td style="padding:12px 16px;border-bottom:1px solid #1e293b;">
                    <span style="color:%s;font-weight:700;">%s</span>
                  </td>
                </tr>
                """.formatted(a.tipo, a.fecha.toString(), color, label));
        }

        return """
            <!DOCTYPE html>
            <html lang="es">
            <head><meta charset="UTF-8"></head>
            <body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
              <div style="max-width:600px;margin:40px auto;background:#0f1923;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.08);">

                <!-- Header -->
                <div style="background:linear-gradient(135deg,#0a1628,#0f1923);padding:32px;border-bottom:1px solid rgba(59,246,59,0.2);">
                  <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px;">
                    <div style="width:36px;height:36px;background:rgba(59,246,59,0.1);border:1px solid rgba(59,246,59,0.3);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px;">🚗</div>
                    <span style="color:#3bf63b;font-weight:800;font-size:18px;">CarCare Tracker</span>
                  </div>
                  <h1 style="color:#fff;font-size:22px;font-weight:800;margin:0;">Alerta de Mantenimiento</h1>
                  <p style="color:#64748b;margin:6px 0 0;font-size:14px;">Revisión pendiente detectada en tu flota</p>
                </div>

                <!-- Vehículo -->
                <div style="padding:24px 32px;border-bottom:1px solid rgba(255,255,255,0.06);">
                  <p style="color:#94a3b8;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;">Vehículo</p>
                  <h2 style="color:#fff;margin:0;font-size:20px;">%s %s</h2>
                  <p style="color:#3bf63b;margin:4px 0 0;font-size:14px;font-family:monospace;">%s</p>
                </div>

                <!-- Tabla alertas -->
                <div style="padding:24px 32px;">
                  <p style="color:#94a3b8;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin:0 0 16px;">Elementos pendientes</p>
                  <table style="width:100%%;border-collapse:collapse;background:#0a0f18;border-radius:12px;overflow:hidden;border:1px solid rgba(255,255,255,0.06);">
                    <thead>
                      <tr style="background:#0d1421;">
                        <th style="padding:10px 16px;text-align:left;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Concepto</th>
                        <th style="padding:10px 16px;text-align:left;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Fecha</th>
                        <th style="padding:10px 16px;text-align:left;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Estado</th>
                      </tr>
                    </thead>
                    <tbody>%s</tbody>
                  </table>
                </div>

                <!-- CTA -->
                <div style="padding:0 32px 32px;">
                  <a href="https://saas-carcare-production.up.railway.app/dashboard"
                     style="display:inline-block;padding:14px 28px;background:linear-gradient(135deg,#22c55e,#3bf63b);color:#000;font-weight:800;font-size:15px;border-radius:10px;text-decoration:none;">
                    Ver mi Flota →
                  </a>
                </div>

                <!-- Footer -->
                <div style="padding:20px 32px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
                  <p style="color:#374151;font-size:12px;margin:0;">CarCare Tracker · Gestión de flotas · Este email fue generado automáticamente</p>
                </div>
              </div>
            </body>
            </html>
            """.formatted(v.getMarca(), v.getModelo(), v.getMatricula(), items.toString());
    }

    private record AlertaItem(String tipo, LocalDate fecha, long diasRestantes) {}
}
