package com.vaultpay.modules.analytics;

import com.vaultpay.common.ApiResponse;
import com.vaultpay.modules.analytics.dto.CategorySpendingDto;
import com.vaultpay.modules.analytics.dto.DailySpendingDto;
import com.vaultpay.modules.analytics.dto.FinancialSummaryDto;
import com.vaultpay.modules.analytics.dto.MonthlyTrendDto;
import com.vaultpay.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
@Tag(name = "Financial Analytics", description = "Aggregated spending, income, cashflow, and categories calculated from ledger records")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/summary")
    @Operation(summary = "Get high-level customer balance and cashflow summary")
    public ResponseEntity<ApiResponse<FinancialSummaryDto>> getSummary(@AuthenticationPrincipal UserPrincipal currentUser) {
        FinancialSummaryDto summary = analyticsService.getSummary(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.ok(summary));
    }

    @GetMapping("/monthly")
    @Operation(summary = "Get monthly income vs expense trends")
    public ResponseEntity<ApiResponse<List<MonthlyTrendDto>>> getMonthlyTrends(@AuthenticationPrincipal UserPrincipal currentUser) {
        List<MonthlyTrendDto> trends = analyticsService.getMonthlyTrends(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.ok(trends));
    }

    @GetMapping("/categories")
    @Operation(summary = "Get spending breakdown by expense category")
    public ResponseEntity<ApiResponse<List<CategorySpendingDto>>> getSpendingCategories(@AuthenticationPrincipal UserPrincipal currentUser) {
        List<CategorySpendingDto> categories = analyticsService.getSpendingCategories(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.ok(categories));
    }

    @GetMapping("/daily")
    @Operation(summary = "Get daily spending timeline")
    public ResponseEntity<ApiResponse<List<DailySpendingDto>>> getDailySpending(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestParam(defaultValue = "14") int days) {
        List<DailySpendingDto> daily = analyticsService.getDailySpending(currentUser.getId(), days);
        return ResponseEntity.ok(ApiResponse.ok(daily));
    }
}
