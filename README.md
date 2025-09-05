# plint - Universal Business Ordering Platform

## About plint

plint is a comprehensive business management platform that allows any business owner to create and manage their online ordering system with a beautiful, minimal WhatsApp-inspired interface.

### 🏪 Core Purpose
Enable any business to create an online presence and manage orders efficiently through a clean, customizable platform with direct WhatsApp integration.

### 👥 Target Users
- **Small to medium businesses** of any type
- **Entrepreneurs** starting any kind of business  
- **Local shops** wanting to go digital
- **Service providers** needing order management
- **Anyone selling** products or services

### 💼 Business Applications
- 🛍️ **Retail & E-commerce**: Clothing, electronics, home goods, jewelry
- 🍕 **Food & Beverage**: Restaurants, cafes, bakeries, catering
- 🎨 **Services**: Beauty salons, cleaning, tutoring, consulting
- 🏠 **Local Businesses**: Hardware stores, bookshops, gift shops
- 📱 **Digital Products**: Software, downloads, courses, subscriptions

## How can I edit this code?

You can edit this application using your preferred IDE.

If you want to work locally using your own IDE, you can clone this repo and push changes.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

This project is configured for deployment on Netlify. You can deploy it by connecting your GitHub repository to Netlify or using the Netlify CLI.

### Deploy with Netlify CLI
```sh
npm install -g netlify-cli
netlify deploy --prod
```

### Connect to Netlify Dashboard
1. Push your code to GitHub
2. Connect your repository to Netlify
3. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`

## Can I connect a custom domain?

Yes, you can connect a custom domain through your Netlify dashboard under Site settings > Domain management.
