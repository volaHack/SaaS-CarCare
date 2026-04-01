package com.ecofleet.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class JwtFilter extends OncePerRequestFilter {

    @Autowired
    private JwtUtil jwtUtil;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {

        String path = request.getRequestURI();

        // Endpoints públicos — no requieren token
        if (path.startsWith("/api/auth/")) {
            chain.doFilter(request, response);
            return;
        }

        // Extraer y validar Bearer token
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            if (jwtUtil.isValid(token)) {
                request.setAttribute("userId", jwtUtil.extractTenantId(token));
                request.setAttribute("userRole", jwtUtil.extractRole(token));
            }
        }

        // Endpoints de GPS del Android — exentos hasta que la app Android se actualice
        if (isAndroidGpsEndpoint(path, request.getMethod())) {
            chain.doFilter(request, response);
            return;
        }

        // Todos los demás endpoints /api/ requieren token válido
        if (path.startsWith("/api/") && request.getAttribute("userId") == null) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.getWriter().write("{\"error\": \"Token de autenticación requerido\"}");
            return;
        }

        chain.doFilter(request, response);
    }

    private boolean isAndroidGpsEndpoint(String path, String method) {
        // POST /api/rutas/{id}/gps — envío de GPS desde la app Android nativa
        if ("POST".equals(method) && path.matches("/api/rutas/[^/]+/gps")) return true;
        // GET /api/rutas/{id}/last-location — usada por el bridge JS de Android
        if ("GET".equals(method) && path.matches("/api/rutas/[^/]+/last-location")) return true;
        // POST /api/rutas/{id}/request-gps
        if ("POST".equals(method) && path.matches("/api/rutas/[^/]+/request-gps")) return true;
        return false;
    }
}
