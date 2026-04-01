package com.ecofleet.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
public class JwtUtil {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration}")
    private long expiration;

    private SecretKey getKey() {
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    /**
     * Genera un token JWT para administradores.
     *
     * @param tenantId El ID que se usa para filtrar datos multi-tenant.
     *                 Para ADMIN: su propio ID.
     *                 Para CONDUCTOR: el empresaId (ID del admin de su empresa).
     * @param role     "ADMIN" o "CONDUCTOR"
     */
    public String generateToken(String tenantId, String role) {
        return Jwts.builder()
                .subject(tenantId)
                .claim("role", role)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(getKey())
                .compact();
    }

    /**
     * Genera un token JWT para conductores incluyendo su propio ID.
     *
     * @param tenantId    El empresaId — para mantener multi-tenant igual que siempre.
     * @param role        "CONDUCTOR"
     * @param conductorId El ID propio del conductor — para filtrar rutas asignadas.
     */
    public String generateToken(String tenantId, String role, String conductorId) {
        return Jwts.builder()
                .subject(tenantId)
                .claim("role", role)
                .claim("conductorId", conductorId)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(getKey())
                .compact();
    }

    public Claims parseToken(String token) {
        return Jwts.parser()
                .verifyWith(getKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public String extractTenantId(String token) {
        return parseToken(token).getSubject();
    }

    public String extractRole(String token) {
        return parseToken(token).get("role", String.class);
    }

    public String extractConductorId(String token) {
        return parseToken(token).get("conductorId", String.class);
    }

    public boolean isValid(String token) {
        try {
            parseToken(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }
}
