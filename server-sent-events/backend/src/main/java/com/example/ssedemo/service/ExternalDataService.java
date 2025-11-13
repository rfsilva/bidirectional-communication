package com.example.ssedemo.service;

import com.example.ssedemo.model.DataEntity;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

/**
 * Serviço para simulação de busca de dados externos.
 * Utiliza Lombok e suporte a internacionalização.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ExternalDataService {

    private final Random random = new Random();
    private final DataService dataService;
    private final SSENotificationService notificationService;
    private final MessageService messageService;

    private boolean appReady = false;

    // Simula dados que poderiam vir de uma API externa
    private final String[] sampleNames = {
        "Produto A", "Produto B", "Produto C", "Serviço X", "Serviço Y",
        "Item Alpha", "Item Beta", "Item Gamma", "Recurso 1", "Recurso 2"
    };

    private final String[] sampleValues = {
        "Disponível", "Em estoque", "Processando", "Concluído", "Pendente",
        "Ativo", "Inativo", "Em análise", "Aprovado", "Rejeitado"
    };

    /**
     * Marca a aplicação como pronta após a inicialização completa.
     */
    @EventListener(ApplicationReadyEvent.class)
    public void onApplicationReady() {
        this.appReady = true;
        log.info("Aplicação pronta para buscar dados externos");
    }

    /**
     * Busca dados externos periodicamente (a cada 30 segundos).
     */
    @Scheduled(fixedRate = 30000, initialDelay = 10000)
    public void fetchExternalDataPeriodically() {
        if (!appReady) {
            log.warn("⏳ Aplicação ainda inicializando — agendamento ignorado temporariamente.");
            return;
        }

        String fetchingMessage = messageService.getMessage("external.data.fetch.periodic", "Iniciando busca de dados externos...");
        log.info(fetchingMessage);
        
        try {
            // Simula uma chance de 70% de ter novos dados
            if (random.nextDouble() < 0.7) {
                List<DataEntity> newData = simulateExternalAPICall();
                
                if (!newData.isEmpty()) {
                    List<DataEntity> savedData = dataService.saveAll(newData);
                    
                    String successMessage = messageService.getSSEMessage("external.data.fetched", savedData.size());
                    log.info("Salvos {} novos registros externos", savedData.size());
                    
                    // Notificar via SSE
                    notificationService.sendDataUpdateNotification(successMessage, savedData.size());
                } else {
                    log.info("Nenhum dado novo encontrado na fonte externa");
                }
            } else {
                log.info("Nenhuma atualização disponível na fonte externa");
            }
            
        } catch (Exception e) {
            String errorMessage = messageService.getMessage("external.data.fetch.error", e.getMessage());
            log.error(errorMessage, e);
            
            // Notificar erro via SSE
            notificationService.sendErrorNotification(
                messageService.getMessage("external.data.fetch.error", "Erro ao importar dados externos"),
                e.getMessage()
            );
        }
    }

    /**
     * Simula uma chamada para API externa.
     *
     * @return Lista de dados simulados
     */
    private List<DataEntity> simulateExternalAPICall() {
        List<DataEntity> externalData = new ArrayList<>();
        
        // Simula latência de rede
        try {
            Thread.sleep(500 + random.nextInt(1000)); // 0.5 a 1.5 segundos
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return externalData;
        }
        
        // Gera entre 1 e 5 novos registros
        int recordCount = 1 + random.nextInt(5);
        
        for (int i = 0; i < recordCount; i++) {
            String name = sampleNames[random.nextInt(sampleNames.length)];
            String value = sampleValues[random.nextInt(sampleValues.length)];
            String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("HH:mm:ss"));
            
            DataEntity entity = new DataEntity(
                name + " - " + timestamp,
                value + " (Externo)",
                true // isExternal = true
            );
            
            externalData.add(entity);
        }
        
        log.debug("Simulação de API externa retornou {} registros", externalData.size());
        return externalData;
    }

    /**
     * Força uma busca manual de dados externos.
     *
     * @return Lista de dados salvos
     * @throws RuntimeException se ocorrer erro na busca
     */
    public List<DataEntity> forceExternalDataFetch() {
        String manualFetchMessage = messageService.getMessage("external.data.fetch.forced");
        log.info(manualFetchMessage);
        
        try {
            List<DataEntity> newData = simulateExternalAPICall();
            
            if (!newData.isEmpty()) {
                List<DataEntity> savedData = dataService.saveAll(newData);
                
                // Notificar via SSE
                String successMessage = messageService.getSSEMessage("external.data.fetched", savedData.size());
                notificationService.sendDataUpdateNotification(successMessage, savedData.size());
                
                return savedData;
            }
            
            return new ArrayList<>();
            
        } catch (Exception e) {
            String errorMessage = messageService.getMessage("external.data.fetch.error", e.getMessage());
            log.error(errorMessage, e);
            
            notificationService.sendErrorNotification(
                messageService.getMessage("external.data.fetch.error", "Erro na busca manual de dados externos"),
                e.getMessage()
            );
            
            throw new RuntimeException("Erro ao buscar dados externos", e);
        }
    }
}