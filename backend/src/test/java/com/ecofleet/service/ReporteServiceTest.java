package com.ecofleet.service;

import com.ecofleet.model.Ruta;
import com.ecofleet.model.Usuario;
import com.ecofleet.model.Vehiculo;
import com.ecofleet.repository.ConfiguracionEmailRepository;
import com.ecofleet.repository.MantenimientoCorrectivoRepository;
import com.ecofleet.repository.MantenimientoPreventivoRepository;
import com.ecofleet.repository.RepostajeRepository;
import com.ecofleet.repository.RutaRepository;
import com.ecofleet.repository.UsuarioRepository;
import com.ecofleet.repository.VehiculoRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReporteServiceTest {

    @Mock private UsuarioRepository usuarioRepository;
    @Mock private VehiculoRepository vehiculoRepository;
    @Mock private RutaRepository rutaRepository;
    @Mock private RepostajeRepository repostajeRepository;
    @Mock private MantenimientoPreventivoRepository preventivosRepo;
    @Mock private MantenimientoCorrectivoRepository correctivosRepo;
    @Mock private ConfiguracionEmailRepository configEmailRepo;
    @Mock private EmailService emailService;

    @InjectMocks private ReporteService reporteService;

    @Test
    void enviarReporte_debeUsarMesActualCuandoEsManualEnPrimerDia() throws Exception {
        prepararEmpresaConVehiculo();

        Ruta rutaAbril = crearRuta("2026-04-02", "PLANIFICADA", 25.0);
        Ruta rutaMarzo = crearRuta("2026-03-28", "COMPLETADA", 30.0);

        when(rutaRepository.findByUsuarioId("empresa-1")).thenReturn(List.of(rutaAbril, rutaMarzo));

        reporteService.enviarReporte("empresa-1", LocalDate.of(2026, 4, 1), false);

        ArgumentCaptor<String> subjectCaptor = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<String> htmlCaptor = ArgumentCaptor.forClass(String.class);
        verify(emailService).enviar(org.mockito.ArgumentMatchers.eq("admin@carcare.test"), subjectCaptor.capture(), htmlCaptor.capture());

        assertThat(subjectCaptor.getValue()).contains("Abril 2026");
        assertThat(htmlCaptor.getValue()).contains("1 planificadas");
        assertThat(htmlCaptor.getValue()).contains("0 completadas (-)");
    }

    @Test
    void enviarReporte_debeUsarMesAnteriorEnCierreMensual() throws Exception {
        prepararEmpresaConVehiculo();

        Ruta rutaAbril = crearRuta("2026-04-02", "PLANIFICADA", 25.0);
        Ruta rutaMarzo = crearRuta("2026-03-28", "COMPLETADA", 30.0);

        when(rutaRepository.findByUsuarioId("empresa-1")).thenReturn(List.of(rutaAbril, rutaMarzo));

        reporteService.enviarReporte("empresa-1", LocalDate.of(2026, 4, 1), true);

        ArgumentCaptor<String> subjectCaptor = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<String> htmlCaptor = ArgumentCaptor.forClass(String.class);
        verify(emailService).enviar(org.mockito.ArgumentMatchers.eq("admin@carcare.test"), subjectCaptor.capture(), htmlCaptor.capture());

        assertThat(subjectCaptor.getValue()).contains("Marzo 2026");
        assertThat(htmlCaptor.getValue()).contains("1 planificadas");
        assertThat(htmlCaptor.getValue()).contains("1 completadas (100%)");
        assertThat(htmlCaptor.getValue()).contains("30 km");
    }

    @Test
    void enviarReporte_debeContarFechasIsoYEstadosConFormatoIrregular() throws Exception {
        prepararEmpresaConVehiculo();

        Ruta ruta = crearRuta("2026-04-10T14:30:00Z", " completada ", 120.0);

        when(rutaRepository.findByUsuarioId("empresa-1")).thenReturn(List.of(ruta));

        reporteService.enviarReporte("empresa-1", LocalDate.of(2026, 4, 15), false);

        ArgumentCaptor<String> htmlCaptor = ArgumentCaptor.forClass(String.class);
        verify(emailService).enviar(org.mockito.ArgumentMatchers.eq("admin@carcare.test"), org.mockito.ArgumentMatchers.anyString(), htmlCaptor.capture());

        assertThat(htmlCaptor.getValue()).contains("1 planificadas");
        assertThat(htmlCaptor.getValue()).contains("1 completadas (100%)");
        assertThat(htmlCaptor.getValue()).contains("120 km");
    }

    private void prepararEmpresaConVehiculo() {
        Usuario admin = new Usuario();
        admin.setId("empresa-1");
        admin.setEmail("admin@carcare.test");
        admin.setNombre("Admin");
        admin.setNombreEmpresa("Mi Flota");

        Vehiculo vehiculo = new Vehiculo();
        vehiculo.setId("veh-1");
        vehiculo.setActivo(true);

        when(usuarioRepository.findById("empresa-1")).thenReturn(Optional.of(admin));
        when(configEmailRepo.findByEmpresaId("empresa-1")).thenReturn(Optional.empty());
        when(vehiculoRepository.findByUsuarioId("empresa-1")).thenReturn(List.of(vehiculo));
        when(repostajeRepository.findByVehiculoId("veh-1")).thenReturn(List.of());
        when(preventivosRepo.findByVehiculoIdOrderByFechaDesc("veh-1")).thenReturn(List.of());
        when(correctivosRepo.findByVehiculoIdOrderByFechaDesc("veh-1")).thenReturn(List.of());
    }

    private Ruta crearRuta(String fecha, String estado, double distancia) {
        Ruta ruta = new Ruta();
        ruta.setFecha(fecha);
        ruta.setEstado(estado);
        ruta.setDistanciaEstimadaKm(distancia);
        return ruta;
    }
}
