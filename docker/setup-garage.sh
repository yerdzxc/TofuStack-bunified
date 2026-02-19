#!/bin/bash
# Garage auto-setup script
# Run this after: docker compose up -d

set -e

CONTAINER_NAME="tofustack-garage-1"
MAX_RETRIES=30

echo "🧪 Setting up Garage S3..."

# Wait for garage to be ready
echo "Waiting for Garage to start..."
for i in $(seq 1 $MAX_RETRIES); do
  if docker exec $CONTAINER_NAME /garage -c /etc/garage.toml status >/dev/null 2>&1; then
    echo "Garage is ready!"
    break
  fi
  echo "Waiting... ($i/$MAX_RETRIES)"
  sleep 2
done

# Get node ID - use tail to get the last few lines which contain the node info
echo "Getting node info..."
NODE_ID=$(docker exec $CONTAINER_NAME /garage -c /etc/garage.toml status 2>&1 | tail -3 | awk '{print $1}' | grep -E "^[a-f0-9]{12,}$" | head -1)

if [ -z "$NODE_ID" ]; then
  echo "❌ Could not get node ID"
  exit 1
fi

echo "Node ID: $NODE_ID"

# Wait for node to be ready
sleep 3

# Assign layout - node ID goes as positional argument
echo "Assigning layout..."
docker exec $CONTAINER_NAME /garage -c /etc/garage.toml layout assign "$NODE_ID" --zone z1 --capacity 1TB 2>&1 | sed 's/\^\[\[2m//g' || true

# Get layout version
echo "Getting layout version..."
LAYOUT_VERSION=$(docker exec $CONTAINER_NAME /garage -c /etc/garage.toml layout show 2>&1 | tail -3 | grep "Current cluster layout version:" | awk '{print $NF}')
echo "Current layout version: $LAYOUT_VERSION"

# Apply layout with version
NEW_VERSION=$((LAYOUT_VERSION + 1))
echo "Applying layout version $NEW_VERSION..."
docker exec $CONTAINER_NAME /garage -c /etc/garage.toml layout apply --version "$NEW_VERSION" 2>&1 | sed 's/\^\[\[2m//g' || true

# Wait for layout to be applied
echo "Waiting for layout to be ready..."
sleep 5

# Create API key
echo "Creating API key..."
KEY_OUTPUT=$(docker exec $CONTAINER_NAME /garage -c /etc/garage.toml key create tofustack 2>&1) || true

# Extract key ID
KEY_ID=$(echo "$KEY_OUTPUT" | grep "Key ID:" | awk '{print $3}' || true)
SECRET=$(echo "$KEY_OUTPUT" | grep "Secret key:" | awk '{print $3}' || true)

if [ -n "$KEY_ID" ]; then
  echo "✅ API Key created!"
  
  # Create bucket
  echo "Creating bucket 'dev'..."
  docker exec $CONTAINER_NAME /garage -c /etc/garage.toml bucket create dev 2>&1 | grep -v "^\[2m" || true
  
  # Allow key to access bucket
  echo "Setting permissions..."
  docker exec $CONTAINER_NAME /garage -c /etc/garage.toml bucket allow dev --key tofustack --read --write --owner 2>&1 | grep -v "^\[2m" || true
  
  echo ""
  echo "🎉 Garage setup complete!"
  echo ""
  echo "Add these to your .env file:"
  echo "STORAGE_ACCESS_KEY=$KEY_ID"
  echo "STORAGE_SECRET_KEY=$SECRET"
else
  echo "❌ Failed to create API key"
  echo "$KEY_OUTPUT"
fi
