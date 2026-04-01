package com.ecofleet.service;

import com.ecofleet.model.Alerta;
import com.ecofleet.repository.AlertaRepository;
import com.ecofleet.repository.MantenimientoCorrectivoRepository;
import com.ecofleet.repository.MantenimientoPreventivoRepository;
import com.ecofleet.repository.RutaRepository;
import com.ecofleet.repository.UsuarioRepository;
import com.ecofleet.repository.VehiculoRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.lang.reflect.Method;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AlertaServiceTest {

    @Mock private AlertaRepository alertaRepository;
    @Mock private UsuarioRepository usuarioRepository;
    @Mock private VehiculoRepository vehiculoRepository;
    @Mock private RutaRepository rutaRepository;
    @Mock private MantenimientoPreventivoRepository preventivoRepo;
    @Mock private MantenimientoCorrectivoRepository correctivoRepo;

    @InjectMocks private AlertaService alertaService;

    @Test
    void crearSiNoExiste_debeActualizarLaAlertaActivaSinDuplicarla() throws Exception {
        Alerta alertaExistente = new Alerta();
        alertaExistente.setId("a1");
        alertaExistente.setGrupoKey("gps_ruta-1");
        alertaExistente.setEmpresaId("empresa-1");
        alertaExistente.setTipo("GPS_PERDIDO");
        alertaExistente.setSeveridad("WARNING");
        alertaExistente.setTitulo("Señal GPS perdida — Ruta A");
        alertaExistente.setDescripcion("Sin actualización GPS desde hace 10 minutos");
        alertaExistente.setRutaId("ruta-1");
        alertaExistente.setVehiculoId("veh-1");
        alertaExistente.setVehiculoInfo("Ruta A");
        alertaExistente.setLeida(true);
        alertaExistente.setResuelta(false);
        alertaExistente.setTimestamp(LocalDateTime.now().minusMinutes(5));

        when(alertaRepository.findByGrupoKeyAndResueltaFalseOrderByTimestampDesc("gps_ruta-1"))
                .thenReturn(List.of(alertaExistente));

        invokeCrearSiNoExiste(
                "gps_ruta-1", "empresa-1", "GPS_PERDIDO", "WARNING",
                "Señal GPS perdida — Ruta A",
                "Sin actualización GPS desde hace 15 minutos",
                "veh-1", "ruta-1", "Ruta A"
        );

        ArgumentCaptor<Alerta> captor = ArgumentCaptor.forClass(Alerta.class);
        verify(alertaRepository).save(captor.capture());

        Alerta guardada = captor.getValue();
        assertThat(guardada.getId()).isEqualTo("a1");
        assertThat(guardada.getDescripcion()).contains("15 minutos");
        assertThat(guardada.isLeida()).isTrue();
        assertThat(guardada.isResuelta()).isFalse();
    }

    @Test
    void crearSiNoExiste_debeResolverDuplicadasYConservarSoloUnaActiva() throws Exception {
        Alerta principal = new Alerta();
        principal.setId("a1");
        principal.setGrupoKey("detenida_ruta-1");
        principal.setEmpresaId("empresa-1");
        principal.setTipo("RUTA_DETENIDA");
        principal.setSeveridad("WARNING");
        principal.setTitulo("Ruta detenida — Ruta A");
        principal.setDescripcion("El vehículo lleva tiempo parado");
        principal.setLeida(false);
        principal.setResuelta(false);
        principal.setTimestamp(LocalDateTime.now());

        Alerta duplicada = new Alerta();
        duplicada.setId("a2");
        duplicada.setGrupoKey("detenida_ruta-1");
        duplicada.setEmpresaId("empresa-1");
        duplicada.setTipo("RUTA_DETENIDA");
        duplicada.setSeveridad("WARNING");
        duplicada.setTitulo("Ruta detenida — Ruta A");
        duplicada.setDescripcion("Duplicada");
        duplicada.setLeida(false);
        duplicada.setResuelta(false);
        duplicada.setTimestamp(LocalDateTime.now().minusMinutes(2));

        when(alertaRepository.findByGrupoKeyAndResueltaFalseOrderByTimestampDesc("detenida_ruta-1"))
                .thenReturn(List.of(principal, duplicada));

        invokeCrearSiNoExiste(
                "detenida_ruta-1", "empresa-1", "RUTA_DETENIDA", "WARNING",
                "Ruta detenida — Ruta A",
                "El vehículo lleva tiempo parado · 8 minutos parado",
                "veh-1", "ruta-1", "Ruta A"
        );

        verify(alertaRepository, times(2)).save(org.mockito.ArgumentMatchers.any(Alerta.class));
        assertThat(duplicada.isResuelta()).isTrue();
    }

    private void invokeCrearSiNoExiste(String grupoKey, String empresaId, String tipo, String severidad,
                                       String titulo, String descripcion,
                                       String vehiculoId, String rutaId, String vehiculoInfo) throws Exception {
        Method method = AlertaService.class.getDeclaredMethod(
                "crearSiNoExiste",
                String.class, String.class, String.class, String.class,
                String.class, String.class, String.class, String.class, String.class
        );
        method.setAccessible(true);
        method.invoke(alertaService, grupoKey, empresaId, tipo, severidad, titulo, descripcion, vehiculoId, rutaId, vehiculoInfo);
    }
}
