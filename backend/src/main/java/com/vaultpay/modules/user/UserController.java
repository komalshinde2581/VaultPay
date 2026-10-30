package com.vaultpay.modules.user;

import com.vaultpay.common.ApiResponse;
import com.vaultpay.common.PagedResponse;
import com.vaultpay.modules.user.dto.ChangePasswordDto;
import com.vaultpay.modules.user.dto.UserProfileDto;
import com.vaultpay.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Tag(name = "User Management", description = "User profile, security credentials, and login audit trails")
public class UserController {

    private final UserService userService;

    @GetMapping("/profile")
    @Operation(summary = "Get current user profile information")
    public ResponseEntity<ApiResponse<UserProfileDto>> getProfile(@AuthenticationPrincipal UserPrincipal currentUser) {
        UserProfileDto profile = userService.getProfile(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.ok(profile));
    }

    @PutMapping("/profile")
    @Operation(summary = "Update profile details (name, phone)")
    public ResponseEntity<ApiResponse<UserProfileDto>> updateProfile(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestParam(required = false) String firstName,
            @RequestParam(required = false) String lastName,
            @RequestParam(required = false) String phone) {
        UserProfileDto updated = userService.updateProfile(currentUser.getId(), firstName, lastName, phone);
        return ResponseEntity.ok(ApiResponse.ok("Profile updated successfully", updated));
    }

    @PostMapping("/change-password")
    @Operation(summary = "Rotate user login password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody ChangePasswordDto dto) {
        userService.changePassword(currentUser.getId(), dto);
        return ResponseEntity.ok(ApiResponse.ok("Password changed successfully", null));
    }

    @GetMapping("/login-history")
    @Operation(summary = "View user device/IP login history")
    public ResponseEntity<ApiResponse<PagedResponse<LoginHistoryEntity>>> getLoginHistory(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<LoginHistoryEntity> pageResult = userService.getLoginHistory(currentUser.getId(), PageRequest.of(page, size));
        PagedResponse<LoginHistoryEntity> paged = PagedResponse.<LoginHistoryEntity>builder()
                .content(pageResult.getContent())
                .pageNumber(pageResult.getNumber())
                .pageSize(pageResult.getSize())
                .totalElements(pageResult.getTotalElements())
                .totalPages(pageResult.getTotalPages())
                .last(pageResult.isLast())
                .build();
        return ResponseEntity.ok(ApiResponse.ok(paged));
    }
}
