package com.example.ssedemo.util;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * Utilitário para gerar hashes de senha BCrypt.
 * Usado para criar senhas para usuários de teste.
 */
public class PasswordHashGenerator {

    public static void main(String[] args) {
        PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
        
        System.out.println("=== Gerador de Hashes BCrypt ===");
        System.out.println();
        
        // Senhas que queremos usar
        String[] passwords = {"admin123", "editor123", "viewer123"};
        String[] users = {"admin", "editor", "viewer"};
        
        for (int i = 0; i < passwords.length; i++) {
            String password = passwords[i];
            String user = users[i];
            String hash = passwordEncoder.encode(password);
            
            System.out.println("Usuário: " + user);
            System.out.println("Senha: " + password);
            System.out.println("Hash: " + hash);
            System.out.println();
            
            // Verificar se o hash funciona
            boolean matches = passwordEncoder.matches(password, hash);
            System.out.println("Verificação: " + (matches ? "✅ OK" : "❌ ERRO"));
            System.out.println("----------------------------------------");
        }
        
        // Testar os hashes existentes
        System.out.println("\n=== Testando Hashes Existentes ===");
        
        String[] existingHashes = {
            "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.", // do data-h2.sql
            "$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.AQubh4a"  // do V6 migration
        };
        
        for (String hash : existingHashes) {
            System.out.println("Hash: " + hash);
            for (String password : passwords) {
                boolean matches = passwordEncoder.matches(password, hash);
                System.out.println("  " + password + ": " + (matches ? "✅ MATCH" : "❌ NO MATCH"));
            }
            System.out.println();
        }
    }
}