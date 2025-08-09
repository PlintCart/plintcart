#!/bin/bash

# Deploy Firestore indexes and rules
echo "Deploying Firestore configuration..."

# Deploy indexes first
firebase deploy --only firestore:indexes

# Then deploy rules
firebase deploy --only firestore:rules

echo "Firestore configuration deployed successfully!"
echo ""
echo "Note: Index creation may take a few minutes to complete."
echo "You can monitor progress in the Firebase Console."
