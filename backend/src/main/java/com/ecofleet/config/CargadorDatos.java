package com.ecofleet.config;

import com.ecofleet.model.Vehiculo;
import com.ecofleet.repository.VehiculoRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
    
@Configuration
public class CargadorDatos {

    @Bean
    public CommandLineRunner iniciarDatos(VehiculoRepository vehiculoRepository) {
        return args -> {
            if (vehiculoRepository.count() == 0) {
                Vehiculo v1 = new Vehiculo();
                v1.setMarca("Toyota");
                v1.setModelo("Corolla Hybrid");
                v1.setMatricula("1234-KBC");
                v1.setKilometraje(15000.0);
                v1.setCombustibleActual(45.0);
                v1.setActivo(true);
                
                Vehiculo v2 = new Vehiculo();
                v2.setMarca("Ford");
                v2.setModelo("Transit");
                v2.setMatricula("5678-LMN");
                v2.setKilometraje(54000.0);
                v2.setCombustibleActual(60.0);
                v2.setActivo(true);

                vehiculoRepository.save(v1);
                vehiculoRepository.save(v2);
                System.out.println("Vehiculos de prueba insertados en MongoDB.");
            }
        };
    }
}
