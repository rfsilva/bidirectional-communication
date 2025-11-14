package com.example.ssedemo;

import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

public class PasswordTest {

    @Test
    public void testPasswords() {
        PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
        
        System.out.println("=== Testando Hashes de Senha ===");
        
        // Hashes existentes no banco
        String hash1 = "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi."; // data-h2.sql
        String hash2 = "$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.AQubh4a"; // V6 migration
        
        // Senhas para testar
        String[] passwords = {"admin123", "editor123", "viewer123", "password", "secret", "123456"};
        
        System.out.println("\nTeste Hash 1 (data-h2.sql): " + hash1);
        for (String password : passwords) {
            boolean matches = passwordEncoder.matches(password, hash1);
            System.out.println("  " + password + ": " + (matches ? "✅ MATCH" : "❌"));
        }
        
        System.out.println("\nTeste Hash 2 (V6 migration): " + hash2);
        for (String password : passwords) {
            boolean matches = passwordEncoder.matches(password, hash2);
            System.out.println("  " + password + ": " + (matches ? "✅ MATCH" : "❌"));
        }
        
        // Gerar novos hashes corretos
        System.out.println("\n=== Gerando Novos Hashes ===");
        String[] correctPasswords = {"admin123", "editor123", "viewer123"};
        for (String password : correctPasswords) {
            String newHash = passwordEncoder.encode(password);
            System.out.println(password + " -> " + newHash);
        }
    }
}