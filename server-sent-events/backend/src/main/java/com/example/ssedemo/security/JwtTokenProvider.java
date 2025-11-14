package com.example.ssedemo.security;

import com.example.ssedemo.model.User;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Date;

/**
 * Provedor de tokens JWT para autenticação.
 */
@Component
@Slf4j
public class JwtTokenProvider {

    private final SecretKey jwtSecret;
    private final int jwtExpirationInMs;

    public JwtTokenProvider(
            @Value("${app.jwt.secret:SSEDemoSecretKeyForJWTTokenGenerationThatMustBeAtLeast256BitsLong}") String jwtSecret,
            @Value("${app.jwt.expiration:86400000}") int jwtExpirationInMs) {
        this.jwtSecret = Keys.hmacShaKeyFor(jwtSecret.getBytes());
        this.jwtExpirationInMs = jwtExpirationInMs;
    }

    /**
     * Gera token JWT para o usuário autenticado.
     */
    public String generateToken(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpirationInMs);

        return Jwts.builder()
                .subject(user.getUsername())
                .claim("userId", user.getId())
                .claim("email", user.getEmail())
                .claim("role", "ROLE_" + user.getRole().name()) // Adiciona prefixo ROLE_
                .claim("fullName", user.getFullName())
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(jwtSecret)
                .compact();
    }

    /**
     * Gera token JWT para um usuário específico.
     */
    public String generateTokenForUser(User user) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpirationInMs);

        return Jwts.builder()
                .subject(user.getUsername())
                .claim("userId", user.getId())
                .claim("email", user.getEmail())
                .claim("role", "ROLE_" + user.getRole().name()) // Adiciona prefixo ROLE_
                .claim("fullName", user.getFullName())
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(jwtSecret)
                .compact();
    }

    /**
     * Extrai username do token JWT.
     */
    public String getUsernameFromToken(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(jwtSecret)
                .build()
                .parseSignedClaims(token)
                .getPayload();

        return claims.getSubject();
    }

    /**
     * Extrai ID do usuário do token JWT.
     */
    public Long getUserIdFromToken(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(jwtSecret)
                .build()
                .parseSignedClaims(token)
                .getPayload();

        return claims.get("userId", Long.class);
    }

    /**
     * Extrai role do usuário do token JWT.
     */
    public String getRoleFromToken(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(jwtSecret)
                .build()
                .parseSignedClaims(token)
                .getPayload();

        return claims.get("role", String.class);
    }

    /**
     * Extrai data de expiração do token.
     */
    public LocalDateTime getExpirationFromToken(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(jwtSecret)
                .build()
                .parseSignedClaims(token)
                .getPayload();

        return claims.getExpiration().toInstant()
                .atZone(ZoneId.systemDefault())
                .toLocalDateTime();
    }

    /**
     * Valida token JWT.
     */
    public boolean validateToken(String token) {
        try {
            Jwts.parser()
                .verifyWith(jwtSecret)
                .build()
                .parseSignedClaims(token);
            return true;
        } catch (SecurityException ex) {
            log.error("Invalid JWT signature: {}", ex.getMessage());
        } catch (MalformedJwtException ex) {
            log.error("Invalid JWT token: {}", ex.getMessage());
        } catch (ExpiredJwtException ex) {
            log.error("Expired JWT token: {}", ex.getMessage());
        } catch (UnsupportedJwtException ex) {
            log.error("Unsupported JWT token: {}", ex.getMessage());
        } catch (IllegalArgumentException ex) {
            log.error("JWT claims string is empty: {}", ex.getMessage());
        }
        return false;
    }

    /**
     * Verifica se token está expirado.
     */
    public boolean isTokenExpired(String token) {
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(jwtSecret)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
            
            return claims.getExpiration().before(new Date());
        } catch (Exception e) {
            return true;
        }
    }

    /**
     * Obtém tempo restante do token em segundos.
     */
    public long getTokenRemainingTime(String token) {
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(jwtSecret)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
            
            long expirationTime = claims.getExpiration().getTime();
            long currentTime = System.currentTimeMillis();
            
            return Math.max(0, (expirationTime - currentTime) / 1000);
        } catch (Exception e) {
            return 0;
        }
    }
}