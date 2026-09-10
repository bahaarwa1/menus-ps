# Menus.ps — Testing Strategy & Quality Assurance

## 1. Testing Pyramid
```
            / \
           /   \        E2E Tests (Playwright)
          / E2E \       Customer Menu -> Kitchen Ticket -> Handover
         /-------\
        /  Integ  \     Integration Tests
       /   Tests   \    API Endpoints & Server Actions
      /-------------\
     /     Unit      \  Unit Tests
    /     Tests       \ Math, Cart calculations, validation
   /-------------------\
```

---

## 2. Test Suites Specification

### 2.1 Unit Testing (Vitest / Jest)
- **Cart Total Calculation**:
  - Verification that item price + extras matches exact expected sum in ₪.
  - Verification that quantity modifications (add, decrement, delete) maintain state integrity without negative quantities.
- **Input Sanitization**:
  - Customer notes with HTML/Script tags stripped before submission.

### 2.2 Integration Testing
- **Order Placement Pipeline**:
  - `POST /api/v1/orders/submit` persists order in DB and broadcasts `order:created` on branch channel.
- **Kitchen Ticket Progression**:
  - State moves `new` -> `cooking` -> `ready` -> `completed`.
  - Reversion test: Trigger `undo` within 8 seconds reverts status; trigger after 8 seconds rejected.

### 2.3 End-to-End (E2E) Critical Flow (Playwright)
```typescript
test('Customer orders from Table 12 and Kitchen receives ticket', async ({ browser }) => {
  const customerContext = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const kitchenContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });

  const customerPage = await customerContext.newPage();
  const kitchenPage = await kitchenContext.newPage();

  // 1. Kitchen screen opens
  await kitchenPage.goto('http://localhost:3000/staff');

  // 2. Customer opens menu for Table 12
  await customerPage.goto('http://localhost:3000/m');
  await customerPage.click('text=أضف');
  await customerPage.click('text=مراجعة وإرسال للمطبخ');
  await customerPage.click('text=تأكيد وإرسال للمطبخ فوراً');

  // 3. Verify kitchen receives order ticket with table 12
  await expect(kitchenPage.locator('text=طاولة 12')).toBeVisible();
});
```

---

## 3. Pre-Deployment Verification Checklist
1. `npm run lint` exits with code 0.
2. `npm run build` generates static and server pages without build failures.
3. Zero console errors on `/`, `/m`, `/staff`, `/demo`.
4. Visual test of Arabic text and RTL alignment on Chrome, Safari, and Edge.
