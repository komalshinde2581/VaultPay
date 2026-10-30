package com.vaultpay.modules.notification;

import com.vaultpay.common.PagedResponse;
import com.vaultpay.exception.ResourceNotFoundException;
import com.vaultpay.modules.notification.dto.NotificationResponseDto;
import com.vaultpay.modules.user.UserEntity;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final NotificationWebSocketHandler webSocketHandler;

    @Transactional
    public NotificationResponseDto createNotification(UserEntity user, String title, String message, NotificationType type, String referenceId) {
        NotificationEntity notification = NotificationEntity.builder()
                .user(user)
                .title(title)
                .message(message)
                .type(type)
                .read(false)
                .referenceId(referenceId)
                .build();

        NotificationEntity saved = notificationRepository.save(notification);
        NotificationResponseDto dto = mapToDto(saved);

        // Push real-time WebSocket alert
        webSocketHandler.sendNotification(user.getId(), dto);
        log.info("Notification created & dispatched to user {}: {}", user.getUsername(), title);

        return dto;
    }

    @Transactional(readOnly = true)
    public PagedResponse<NotificationResponseDto> getUserNotifications(Long userId, Pageable pageable) {
        Page<NotificationEntity> page = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
        return PagedResponse.<NotificationResponseDto>builder()
                .content(page.getContent().stream().map(this::mapToDto).toList())
                .pageNumber(page.getNumber())
                .pageSize(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(Long userId) {
        return notificationRepository.countByUserIdAndReadFalse(userId);
    }

    @Transactional
    public void markAsRead(Long userId, Long notificationId) {
        NotificationEntity notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found: " + notificationId));

        if (notification.getUser().getId().equals(userId)) {
            notification.setRead(true);
            notificationRepository.save(notification);
        }
    }

    @Transactional
    public void markAllAsRead(Long userId) {
        notificationRepository.markAllAsRead(userId);
    }

    private NotificationResponseDto mapToDto(NotificationEntity entity) {
        return NotificationResponseDto.builder()
                .id(entity.getId())
                .title(entity.getTitle())
                .message(entity.getMessage())
                .type(entity.getType().name())
                .read(entity.isRead())
                .referenceId(entity.getReferenceId())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
