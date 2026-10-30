package com.vaultpay.modules.beneficiary;

import com.vaultpay.common.ApiResponse;
import com.vaultpay.modules.beneficiary.dto.BeneficiaryResponseDto;
import com.vaultpay.modules.beneficiary.dto.CreateBeneficiaryRequest;
import com.vaultpay.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/beneficiaries")
@RequiredArgsConstructor
@Tag(name = "Beneficiaries", description = "Management of approved transfer beneficiaries and cooling periods")
public class BeneficiaryController {

    private final BeneficiaryService beneficiaryService;

    @GetMapping
    @Operation(summary = "List all active beneficiaries for current user")
    public ResponseEntity<ApiResponse<List<BeneficiaryResponseDto>>> getMyBeneficiaries(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        List<BeneficiaryResponseDto> beneficiaries = beneficiaryService.getUserBeneficiaries(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.ok(beneficiaries));
    }

    @PostMapping
    @Operation(summary = "Add a new beneficiary with automatic cooling period")
    public ResponseEntity<ApiResponse<BeneficiaryResponseDto>> addBeneficiary(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody CreateBeneficiaryRequest request) {
        BeneficiaryResponseDto response = beneficiaryService.addBeneficiary(currentUser.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Beneficiary added successfully", response));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete an existing beneficiary")
    public ResponseEntity<ApiResponse<Void>> deleteBeneficiary(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        beneficiaryService.deleteBeneficiary(currentUser.getId(), id);
        return ResponseEntity.ok(ApiResponse.ok("Beneficiary removed successfully", null));
    }
}
