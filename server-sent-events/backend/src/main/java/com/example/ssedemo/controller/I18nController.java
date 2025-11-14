package com.example.ssedemo.controller;

import com.example.ssedemo.service.MessageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Controller para demonstração das funcionalidades de internacionalização.
 * 
 * COMPORTAMENTO I18N:
 * - Por padrão: TODAS as respostas são em INGLÊS
 * - Para outros idiomas: usar parâmetro ?lang=pt|es|it
 * - Header Accept-Language é IGNORADO
 * - Frontend deve solicitar explicitamente o idioma desejado
 */
@RestController
@RequestMapping("/api/i18n")
@Tag(name = "Internationalization", description = "Endpoints para demonstração de internacionalização")
@RequiredArgsConstructor
public class I18nController {

    private final MessageService messageService;

    @Operation(
        summary = "Obter mensagens traduzidas", 
        description = "Retorna exemplos de mensagens traduzidas. " +
                     "Por padrão em INGLÊS. Use ?lang=pt para português, ?lang=es para espanhol, ?lang=it para italiano."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Mensagens retornadas com sucesso",
                content = @Content(mediaType = "application/json",
                    examples = {
                        @ExampleObject(name = "English (default)", value = """
                            {
                                "currentLocale": "en",
                                "userMessages": {
                                    "welcome": "Service is running",
                                    "dataCreated": "New record created: Example"
                                }
                            }
                            """),
                        @ExampleObject(name = "Portuguese (?lang=pt)", value = """
                            {
                                "currentLocale": "pt",
                                "userMessages": {
                                    "welcome": "Serviço está funcionando",
                                    "dataCreated": "Novo registro criado: Exemplo"
                                }
                            }
                            """)
                    }))
    })
    @GetMapping("/userMessages")
    public ResponseEntity<Map<String, Object>> getTranslatedMessages(
            @Parameter(description = "Idioma desejado (pt, es, it). Se não informado, usa inglês.", 
                      example = "pt")
            @RequestParam(name = "lang", required = false) String lang) {
        
        Locale currentLocale = messageService.getCurrentLocale();
        
        Map<String, String> userMessages = Map.of(
            "welcome", messageService.getMessage("health.status.up"),
            "dataCreated", messageService.getSuccessMessage("created", "Example"),
            "dataUpdated", messageService.getSuccessMessage("updated", "Example"),
            "dataDeleted", messageService.getSuccessMessage("deleted", "123"),
            "recordNotFound", messageService.getErrorMessage("record.not.found"),
            "sseConnected", messageService.getSSEMessage("connection.established"),
            "externalDataFetched", messageService.getSSEMessage("external.data.fetched", 5)
        );
        
        return ResponseEntity.ok(Map.of(
            "currentLocale", currentLocale.toString(),
            "language", currentLocale.getDisplayLanguage(Locale.ENGLISH),
            "requestedLang", lang != null ? lang : "default (en)",
            "behavior", "Default: English. Use ?lang=pt|es|it for other languages",
            "userMessages", userMessages
        ));
    }

    @Operation(
        summary = "Listar idiomas suportados", 
        description = "Retorna a lista de idiomas suportados pela aplicação e explica o comportamento padrão"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Lista de idiomas retornada com sucesso",
                content = @Content(mediaType = "application/json",
                    examples = @ExampleObject(value = """
                        {
                            "defaultBehavior": "All responses in English unless ?lang= parameter is used",
                            "supportedLocales": [
                                {"code": "en", "name": "English", "isDefault": true},
                                {"code": "pt", "name": "Português", "usage": "?lang=pt"},
                                {"code": "es", "name": "Español", "usage": "?lang=es"},
                                {"code": "it", "name": "Italiano", "usage": "?lang=it"}
                            ]
                        }
                        """)))
    })
    @GetMapping("/locales")
    public ResponseEntity<Map<String, Object>> getSupportedLocales() {
        List<Map<String, Object>> locales = Arrays.asList(
            Map.of(
                "code", "en",
                "name", "English",
                "displayName", "English",
                "isDefault", true,
                "usage", "Default - no parameter needed"
            ),
            Map.of(
                "code", "pt",
                "name", "Português",
                "displayName", "Portuguese",
                "isDefault", false,
                "usage", "Add ?lang=pt to any endpoint"
            ),
            Map.of(
                "code", "es",
                "name", "Español",
                "displayName", "Spanish",
                "isDefault", false,
                "usage", "Add ?lang=es to any endpoint"
            ),
            Map.of(
                "code", "it",
                "name", "Italiano",
                "displayName", "Italian",
                "isDefault", false,
                "usage", "Add ?lang=it to any endpoint"
            )
        );
        
        return ResponseEntity.ok(Map.of(
            "defaultBehavior", "All responses in English unless ?lang= parameter is used",
            "ignoresAcceptLanguageHeader", true,
            "requiresExplicitLangParam", true,
            "supportedLocales", locales,
            "currentLocale", messageService.getCurrentLocale().toString(),
            "examples", Map.of(
                "english", "/api/health",
                "portuguese", "/api/health?lang=pt",
                "spanish", "/api/health?lang=es",
                "italian", "/api/health?lang=it"
            )
        ));
    }

    @Operation(
        summary = "Testar mensagem específica", 
        description = "Retorna uma mensagem específica traduzida. Use ?lang= para especificar o idioma."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Mensagem retornada com sucesso"),
        @ApiResponse(responseCode = "404", description = "Chave de mensagem não encontrada")
    })
    @GetMapping("/message/{key}")
    public ResponseEntity<Map<String, Object>> getSpecificMessage(
            @Parameter(description = "Chave da mensagem a ser traduzida", required = true)
            @PathVariable String key,
            @Parameter(description = "Idioma desejado (pt, es, it). Se não informado, usa inglês.")
            @RequestParam(name = "lang", required = false) String lang,
            @Parameter(description = "Argumentos opcionais para a mensagem")
            @RequestParam(required = false) List<String> args) {
        
        String message;
        if (args != null && !args.isEmpty()) {
            message = messageService.getMessage(key, args.toArray());
        } else {
            message = messageService.getMessage(key);
        }
        
        return ResponseEntity.ok(Map.of(
            "key", key,
            "message", message,
            "locale", messageService.getCurrentLocale().toString(),
            "requestedLang", lang != null ? lang : "default (en)",
            "args", args != null ? args : List.of(),
            "note", "Use ?lang=pt|es|it for other languages"
        ));
    }

    @Operation(
        summary = "Demonstração de comportamento I18N", 
        description = "Endpoint para demonstrar como o sistema de I18N funciona com diferentes parâmetros"
    )
    @GetMapping("/demo")
    public ResponseEntity<Map<String, Object>> demonstrateI18nBehavior(
            @Parameter(description = "Idioma desejado (pt, es, it)")
            @RequestParam(name = "lang", required = false) String lang) {
        
        Locale currentLocale = messageService.getCurrentLocale();
        
        return ResponseEntity.ok(Map.of(
            "explanation", Map.of(
                "defaultBehavior", "Backend always responds in English",
                "toChangeLanguage", "Add ?lang=pt (or es, it) to any endpoint",
                "headerIgnored", "Accept-Language header is ignored",
                "frontendStrategy", "Frontend should add ?lang=pt to all requests for Portuguese"
            ),
            "currentRequest", Map.of(
                "langParam", lang != null ? lang : "not provided",
                "resolvedLocale", currentLocale.toString(),
                "resultingLanguage", currentLocale.getDisplayLanguage(Locale.ENGLISH)
            ),
            "examples", Map.of(
                "english", "/api/health (default)",
                "portuguese", "/api/health?lang=pt",
                "spanish", "/api/health?lang=es", 
                "italian", "/api/health?lang=it"
            ),
            "sampleMessage", messageService.getMessage("health.status.up")
        ));
    }
}