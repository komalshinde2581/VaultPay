package com.vaultpay.modules.outbox;

import com.vaultpay.config.KafkaConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.data.domain.PageRequest;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class OutboxRelayScheduler {

    private final OutboxEventRepository outboxEventRepository;
    private final ObjectProvider<KafkaTemplate<String, String>> kafkaTemplateProvider;

    @Scheduled(fixedDelayString = "${vaultpay.outbox.relay-interval-ms:5000}")
    @Transactional
    public void relayPendingEvents() {
        List<OutboxEventEntity> pendingEvents = outboxEventRepository.findByStatusAndRetryCountLessThanOrderByCreatedAtAsc(
                "PENDING", 5, PageRequest.of(0, 50));

        if (pendingEvents.isEmpty()) {
            return;
        }

        KafkaTemplate<String, String> kafkaTemplate = kafkaTemplateProvider.getIfAvailable();
        if (kafkaTemplate == null) {
            // Local dev mode without Kafka: mark processed directly
            for (OutboxEventEntity event : pendingEvents) {
                event.setStatus("PUBLISHED");
                event.setProcessedAt(Instant.now());
            }
            outboxEventRepository.saveAll(pendingEvents);
            return;
        }

        for (OutboxEventEntity event : pendingEvents) {
            String topic = resolveTopicForEvent(event.getEventType());
            try {
                kafkaTemplate.send(topic, event.getAggregateId(), event.getPayload());
                event.setStatus("PUBLISHED");
                event.setProcessedAt(Instant.now());
                log.info("Relayed outbox event {} to Kafka topic {}", event.getId(), topic);
            } catch (Exception ex) {
                event.setRetryCount(event.getRetryCount() + 1);
                if (event.getRetryCount() >= 5) {
                    event.setStatus("FAILED");
                }
                log.warn("Could not dispatch event {} to Kafka (will retry): {}", event.getId(), ex.getMessage());
            }
        }
        outboxEventRepository.saveAll(pendingEvents);
    }

    private String resolveTopicForEvent(String eventType) {
        if (eventType.contains("Fraud")) {
            return KafkaConfig.FRAUD_TOPIC;
        } else if (eventType.contains("Notification")) {
            return KafkaConfig.NOTIFICATIONS_TOPIC;
        }
        return KafkaConfig.TRANSACTIONS_TOPIC;
    }
}
