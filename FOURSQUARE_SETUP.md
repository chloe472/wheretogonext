# Foursquare API Setup (Optional - for Better Venue Photos)

## Why Foursquare?

- **Best for venue photos**: Real photos from actual businesses (museums, restaurants, attractions)
- **Free tier**: 100,000 API calls/month
- **No credit card required**
- **Quick signup**: Takes 2 minutes

## How to Get Your API Key

1. **Sign up** (or log in if you have an account):
   - Go to: https://foursquare.com/developers/signup
   - Create a free account (no credit card needed)

2. **Create a project**:
   - After signup, go to: https://foursquare.com/developers/apps
   - Click **"Create a New Project"**
   - Project Name: `WhereToGoNext` (or any name)
   - Click **Create**

3. **Get your API key**:
   - In your project dashboard, you'll see your **API Key**
   - Copy the entire key (it starts with `fsq_`)

4. **Add to your backend**:
   - Open `backend/.env`
   - Find the line: `FOURSQUARE_API_KEY=`
   - Paste your key after the `=`
   - Example: `FOURSQUARE_API_KEY=fsq_abc123xyz...`

5. **Restart the backend server**:
   ```bash
   cd backend
   npm run dev
   ```

## What Happens Now?

With Foursquare enabled:

- **Place images** will prioritize real venue photos from Foursquare
- **Fallback chain**: Foursquare → Wikimedia Commons → Wikipedia → Openverse
- **Better accuracy**: Each venue gets its actual photo instead of generic images

Without Foursquare (key not set):

- App still works fine
- Uses Wikimedia Commons and Wikipedia for images
- Some venues might get generic photos instead of specific ones

## Free Tier Limits

- **100,000 API calls/month** (very generous)
- For context: ~3,000 calls per day or ~125 per hour
- Each place image request = 1-2 calls max
- Perfect for development and moderate production use

## Troubleshooting

**"API key invalid"**

- Make sure you copied the entire key (starts with `fsq_`)
- Check for extra spaces in the `.env` file
- Restart the backend server after adding the key

**"Rate limit exceeded"**

- Free tier is 100k/month
- If you hit the limit, app falls back to other image sources
- Consider caching or upgrading to paid tier for production

## Optional: Verify It's Working

After adding the API key and restarting:

1. Open your app
2. Search for "Kuala Lumpur"
3. Look at place images - they should load faster and be more accurate
4. Check backend console - you should see Foursquare API calls succeed
