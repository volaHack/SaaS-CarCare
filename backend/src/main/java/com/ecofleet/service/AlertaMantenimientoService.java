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

    @Autowired private JavaMailSender mailSender;
    @Autowired private VehiculoRepository vehiculoRepository;
    @Autowired private UsuarioRepository usuarioRepository;

    @Value("${spring.mail.username:}")
    private String remitente;

    public boolean isEmailConfigured() {
        return remitente != null && !remitente.isBlank();
    }

    /** Cron diario a las 9:00 AM */
    @Scheduled(cron = "0 0 9 * * *")
    public void verificarAlertas() {
        if (!isEmailConfigured()) {
            logger.warn("GMAIL_USER no configurado — alertas desactivadas.");
            return;
        }
        logger.info("═══ VERIFICANDO ALERTAS DE MANTENIMIENTO ═══");
        LocalDate hoy = LocalDate.now();

        for (Vehiculo v : vehiculoRepository.findAll()) {
            if (v.getUsuarioId() == null) continue;
            Optional<Usuario> adminOpt = usuarioRepository.findById(v.getUsuarioId());
            if (adminOpt.isEmpty()) continue;

            Usuario admin = adminOpt.get();
            if (!admin.isAlertasActivas()) continue;

            String emailDestino = admin.getEmailNotificaciones() != null && !admin.getEmailNotificaciones().isBlank()
                ? admin.getEmailNotificaciones() : admin.getEmail();
            if (emailDestino == null) continue;

            int[] umbrales = {
                admin.getDiasAlerta30() > 0 ? admin.getDiasAlerta30() : 30,
                admin.getDiasAlerta7()  > 0 ? admin.getDiasAlerta7()  : 7,
                admin.getDiasAlerta1()  > 0 ? admin.getDiasAlerta1()  : 1
            };

            List<AlertaItem> alertas = new ArrayList<>();
            if (admin.isAlertaITV())      checkFecha(v.getFechaITV(),          "ITV",              hoy, umbrales, alertas);
            if (admin.isAlertaSeguro())   checkFecha(v.getFechaSeguro(),        "Seguro",           hoy, umbrales, alertas);
            if (admin.isAlertaRevision()) checkFecha(v.getFechaRevision(),      "Revisión General", hoy, umbrales, alertas);
            if (admin.isAlertaAceite())   checkFecha(v.getFechaCambioAceite(),  "Cambio de Aceite", hoy, umbrales, alertas);

            if (!alertas.isEmpty()) {
                try {
                    enviarEmail(emailDestino, v, alertas);
                    logger.info("✓ Alerta enviada a {} — vehículo {}", emailDestino, v.getMatricula());
                } catch (Exception e) {
                    logger.error("Error enviando alerta a {}: {}", emailDestino, e.getMessage());
                }
            }
        }
    }

    private void checkFecha(String fechaStr, String tipo, LocalDate hoy, int[] umbrales, List<AlertaItem> alertas) {
        if (fechaStr == null || fechaStr.isBlank()) return;
        try {
            LocalDate fecha = LocalDate.parse(fechaStr, DateTimeFormatter.ISO_LOCAL_DATE);
            long dias = ChronoUnit.DAYS.between(hoy, fecha);
            for (int umbral : umbrales) {
                if (dias == umbral) { alertas.add(new AlertaItem(tipo, fecha, dias)); return; }
            }
            if (dias < 0 && dias >= -7) alertas.add(new AlertaItem(tipo, fecha, dias));
        } catch (Exception e) {
            logger.warn("Fecha inválida para {}: {}", tipo, fechaStr);
        }
    }

    public void enviarEmail(String dest, Vehiculo v, List<AlertaItem> alertas) throws Exception {
        MimeMessage msg = mailSender.createMimeMessage();
        MimeMessageHelper h = new MimeMessageHelper(msg, true, "UTF-8");
        h.setFrom(remitente, "CarCare Tracker");
        h.setTo(dest);
        h.setSubject("🚗 Alerta de Mantenimiento — " + v.getMarca() + " " + v.getModelo() + " (" + v.getMatricula() + ")");
        h.setText(buildHtml(v, alertas), true);
        mailSender.send(msg);
    }

    public void enviarEmailPrueba(String dest, String empresa) throws Exception {
        MimeMessage msg = mailSender.createMimeMessage();
        MimeMessageHelper h = new MimeMessageHelper(msg, true, "UTF-8");
        h.setFrom(remitente, "CarCare Tracker");
        h.setTo(dest);
        h.setSubject("✅ Email de prueba — CarCare Tracker");
        h.setText(buildHtmlPrueba(empresa), true);
        mailSender.send(msg);
    }

    private String buildHtmlPrueba(String empresa) {
        return """
            <!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"></head>
            <body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,sans-serif;">
              <div style="max-width:520px;margin:40px auto;background:#0f1923;border-radius:16px;overflow:hidden;border:1px solid rgba(59,246,59,0.2);">
                <div style="padding:32px;border-bottom:1px solid rgba(59,246,59,0.15);">
                  <span style="color:#3bf63b;font-weight:800;font-size:18px;">✅ CarCare Tracker</span>
                  <h1 style="color:#fff;font-size:20px;font-weight:800;margin:12px 0 4px;">Email configurado correctamente</h1>
                  <p style="color:#64748b;margin:0;font-size:14px;">Las alertas de mantenimiento están activas para <strong style="color:#e2e8f0;">%s</strong>.</p>
                </div>
                <div style="padding:24px 32px;">
                  <p style="color:#94a3b8;font-size:14px;line-height:1.6;">
                    Recibirás notificaciones automáticas cuando algún vehículo de tu flota tenga una fecha de mantenimiento próxima (ITV, seguro, revisión, cambio de aceite).
                  </p>
                </div>
                <div style="padding:0 32px 32px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;padding-top:20px;">
                  <p style="color:#374151;font-size:12px;margin:0;">CarCare Tracker · Email generado automáticamente</p>
                </div>
              </div>
            </body></html>
            """.formatted(empresa != null ? empresa : "tu empresa");
    }

    private String buildHtml(Vehiculo v, List<AlertaItem> alertas) {
        StringBuilder rows = new StringBuilder();
        for (AlertaItem a : alertas) {
            String color = a.dias() <= 1 ? "#ef4444" : a.dias() <= 7 ? "#f97316" : "#f59e0b";
            String label = a.dias() < 0  ? "⚠️ Venció hace " + Math.abs(a.dias()) + " días"
                         : a.dias() == 0 ? "🚨 ¡Vence HOY!"
                         : a.dias() == 1 ? "🔴 Mañana"
                         : "⏰ En " + a.dias() + " días";
            rows.append("""
                <tr>
                  <td style="padding:11px 16px;border-bottom:1px solid #1e293b;color:#e2e8f0;font-weight:600;">%s</td>
                  <td style="padding:11px 16px;border-bottom:1px solid #1e293b;color:#94a3b8;">%s</td>
                  <td style="padding:11px 16px;border-bottom:1px solid #1e293b;font-weight:700;color:%s;">%s</td>
                </tr>""".formatted(a.tipo(), a.fecha().toString(), color, label));
        }
        return """
            <!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"></head>
            <body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
              <div style="max-width:600px;margin:40px auto;background:#0f1923;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.08);">
                <div style="background:linear-gradient(135deg,#0a1628,#0f1923);padding:32px;border-bottom:1px solid rgba(59,246,59,0.2);">
                  <span style="color:#3bf63b;font-weight:800;font-size:18px;">🚗 CarCare Tracker</span>
                  <h1 style="color:#fff;font-size:22px;font-weight:800;margin:12px 0 4px;">Alerta de Mantenimiento</h1>
                  <p style="color:#64748b;margin:0;font-size:14px;">Revisión pendiente detectada en tu flota</p>
                </div>
                <div style="padding:20px 32px;border-bottom:1px solid rgba(255,255,255,0.06);">
                  <p style="color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin:0 0 6px;">Vehículo</p>
                  <h2 style="color:#fff;margin:0;font-size:20px;">%s %s</h2>
                  <p style="color:#3bf63b;margin:4px 0 0;font-size:14px;font-family:monospace;">%s</p>
                </div>
                <div style="padding:24px 32px;">
                  <table style="width:100%%;border-collapse:collapse;background:#0a0f18;border-radius:10px;overflow:hidden;border:1px solid rgba(255,255,255,0.06);">
                    <thead><tr style="background:#0d1421;">
                      <th style="padding:9px 16px;text-align:left;color:#64748b;font-size:11px;text-transform:uppercase;">Concepto</th>
                      <th style="padding:9px 16px;text-align:left;color:#64748b;font-size:11px;text-transform:uppercase;">Fecha</th>
                      <th style="padding:9px 16px;text-align:left;color:#64748b;font-size:11px;text-transform:uppercase;">Estado</th>
                    </tr></thead>
                    <tbody>%s</tbody>
                  </table>
                </div>
                <div style="padding:0 32px 28px;">
                  <a href="https://saas-carcare-production.up.railway.app/dashboard"
                     style="display:inline-block;padding:13px 26px;background:linear-gradient(135deg,#22c55e,#3bf63b);color:#000;font-weight:800;font-size:14px;border-radius:10px;text-decoration:none;">
                    Ver mi Flota →
                  </a>
                </div>
                <div style="padding:18px 32px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
                  <p style="color:#374151;font-size:11px;margin:0;">CarCare Tracker · Gestión de flotas · Email automático</p>
                </div>
              </div>
            </body></html>
            """.formatted(v.getMarca(), v.getModelo(), v.getMatricula(), rows.toString());
    }

    private record AlertaItem(String tipo, LocalDate fecha, long dias) {}
}
