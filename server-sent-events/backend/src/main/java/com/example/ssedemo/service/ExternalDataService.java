package com.example.ssedemo.service;

import com.example.ssedemo.model.DataEntity;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

@Service
public class ExternalDataService {

    private static final Logger logger = LoggerFactory.getLogger(ExternalDataService.class);
    private final Random random = new Random();
    
    @Autowired
    private DataService dataService;
    
    @Autowired
    private SSENotificationService notificationService;

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

    @EventListener(ApplicationReadyEvent.class)
    public void onApplicationReady() {
        this.appReady = true;
        logger.info("Application ready");
    }

    @Scheduled(fixedRate = 30000, initialDelay = 10000) // A cada 1 minuto para demonstração
    public void fetchExternalDataPeriodically() {
        if (!appReady) {
            logger.warn("⏳ Aplicação ainda inicializando — agendamento ignorado temporariamente.");
            return;
        }

        logger.info("Iniciando busca de dados externos...");
        
        try {
            // Simula uma chance de 70% de ter novos dados
            if (random.nextDouble() < 0.7) {
                List<DataEntity> newData = simulateExternalAPICall();
                
                if (!newData.isEmpty()) {
                    List<DataEntity> savedData = dataService.saveAll(newData);
                    
                    logger.info("Salvos {} novos registros externos", savedData.size());
                    
                    // Notificar via SSE
                    notificationService.sendDataUpdateNotification(
                        String.format("Importados %d novos registros de fonte externa", savedData.size()),
                        savedData.size()
                    );
                } else {
                    logger.info("Nenhum dado novo encontrado na fonte externa");
                }
            } else {
                logger.info("Nenhuma atualização disponível na fonte externa");
            }
            
        } catch (Exception e) {
            logger.error("Erro ao buscar dados externos: {}", e.getMessage(), e);
            
            // Notificar erro via SSE
            notificationService.sendErrorNotification(
                "Erro ao importar dados externos",
                e.getMessage()
            );
        }
    }

    // Simula chamada para API externa
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
        
        logger.debug("Simulação de API externa retornou {} registros", externalData.size());
        return externalData;
    }

    // Método para forçar busca manual (útil para testes)
    public List<DataEntity> forceExternalDataFetch() {
        logger.info("Busca manual de dados externos solicitada");
        
        try {
            List<DataEntity> newData = simulateExternalAPICall();
            
            if (!newData.isEmpty()) {
                List<DataEntity> savedData = dataService.saveAll(newData);
                
                // Notificar via SSE
                notificationService.sendDataUpdateNotification(
                    String.format("Busca manual: importados %d registros", savedData.size()),
                    savedData.size()
                );
                
                return savedData;
            }
            
            return new ArrayList<>();
            
        } catch (Exception e) {
            logger.error("Erro na busca manual de dados externos: {}", e.getMessage(), e);
            
            notificationService.sendErrorNotification(
                "Erro na busca manual de dados externos",
                e.getMessage()
            );
            
            throw new RuntimeException("Erro ao buscar dados externos", e);
        }
    }
}