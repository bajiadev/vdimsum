# Rewards System

A complete points-based rewards system for collection-only items.

## Features

- ✅ Users earn points on every order (1 point per pence)
- ✅ Points expire after 1 year
- ✅ Browse redeemable items (collection only)
- ✅ Redeem items with points
- ✅ Stock management
- ✅ Redemption history tracking
- ✅ Real-time points balance

## User Flow

1. **Earn Points**: Place an order → Payment successful → Points awarded automatically
2. **Browse Rewards**: Profile → "Redeem Rewards" button or "Rewards & Redemptions" menu
3. **Redeem Item**: Select item → Confirm → Points deducted → Redemption created
4. **Collect**: Visit store to collect redeemed item
5. **History**: View past redemptions via history icon

## Pages

### `/rewards` - Main Rewards Page

- Shows user's point balance
- Lists all available collection-only items
- Item cards with image, description, points cost, stock
- Redeem button (disabled if insufficient points)
- Pull to refresh

### `/rewards/history` - Redemption History

- Lists all user redemptions
- Status badges: Pending Collection, Collected, Cancelled
- Timestamp for each redemption

### Profile Integration

- Points card showing balance and GBP value
- "Redeem Rewards" button
- "Rewards & Redemptions" menu item

## Admin Setup

### 1. Add Redeemable Items

Edit and run the admin script:

```bash
# Set your Firebase credentials
$env:GOOGLE_APPLICATION_CREDENTIALS="path/to/service-account.json"

# Run the script
node restaurandAdmin/addRedeemableItems.js
```

Edit `addRedeemableItems.js` to add your items:

```js
{
  name: "Free Coffee",
  pointsCost: 500,
  description: "Redeem for one free regular coffee",
  image_url: "https://...",
  is_available: true,
  collection_only: true,
  stock: 50, // or null for unlimited
}
```

### 2. Manage Items

Use Firebase Console to:

- Update `is_available` to enable/disable items
- Update `stock` to manage inventory
- Update `pointsCost` to change prices
- Add/remove items

### 3. Mark Redemptions as Collected

In Firebase Console → `redemptions` collection:

- Update `status` from `"pending_collection"` to `"collected"`
- Consider building a staff app for this

## Firestore Structure

```
users/{userId}
  - points: 500
  - lastPointsUpdate: Timestamp
  - pointTransactions/{transId}
      - type: "earn" | "redeem"
      - amount: 50
      - description: "..."
      - expiresAt: Timestamp
      - createdAt: Timestamp

redeemableItems/{itemId}
  - name: "Free Coffee"
  - pointsCost: 500
  - description: "..."
  - image_url: "..."
  - is_available: true
  - collection_only: true
  - stock: 50
  - created_at: Timestamp

redemptions/{redemptionId}
  - userId: "..."
  - itemId: "..."
  - itemName: "Free Coffee"
  - pointsCost: 500
  - quantity: 1
  - totalPoints: 500
  - status: "pending_collection" | "collected" | "cancelled"
  - createdAt: Timestamp
```

## Points Logic

### Earning Points

- **Rate**: 1 point per pence (100 points = £1)
- **When**: Automatically after successful payment
- **Expiry**: 1 year from earning date

### Redeeming Points

- Check user has sufficient balance
- Check item availability and stock
- Create redemption order
- Deduct points
- Update stock (if tracked)

### Balance Calculation

- Sums all "earn" transactions that haven't expired
- Excludes already redeemed points

## API Functions

All functions in `lib/firebase.ts`:

```typescript
// Points
getUserPoints(userId: string): Promise<number>
awardPointsOnOrder(userId, orderId, totalAmountPence)
redeemPoints(userId, pointsToRedeem, description)
getPointTransactions(userId, limit): Promise<PointTransaction[]>

// Rewards
getRedeemableItems(): Promise<RedeemableItem[]>
redeemItem(userId, itemId, quantity): Promise<string>
getUserRedemptions(userId): Promise<Redemption[]>
```

## Future Enhancements

- [ ] Staff app to manage redemptions
- [ ] Push notifications for redemption updates
- [ ] QR code for collection verification
- [ ] Weekly/monthly reward promotions
- [ ] Birthday bonus points
- [ ] Referral rewards
- [ ] Tier system (Bronze/Silver/Gold)
