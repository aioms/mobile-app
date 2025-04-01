# AIOS Mobile - All-In-One System Management

![AIOS Mobile](https://img.shields.io/badge/AIOS-Mobile-blue)
![React](https://img.shields.io/badge/React-18-61DAFB)
![Ionic](https://img.shields.io/badge/Ionic-8.0-3880FF)
![TypeScript](https://img.shields.io/badge/TypeScript-5.1-3178C6)
![License](https://img.shields.io/badge/license-MIT-green)

## Introduction

AIOS Mobile is a powerful, cross-platform mobile application built with React, Ionic, and Capacitor. It provides a comprehensive system management solution with features like inventory tracking, barcode scanning, and real-time data synchronization.

## Features

- 📱 **Cross-Platform Support**: iOS and Android compatibility
- 🔄 **Real-time Sync**: Seamless data synchronization across devices
- 📷 **Advanced Scanning**: Built-in barcode and QR code scanning
- 🎨 **Modern UI**: Sleek interface with Ionic components and TailwindCSS
- 🔐 **Secure Storage**: Local data persistence with SQLite
- 🌐 **PWA Support**: Progressive Web App capabilities
- 📊 **Analytics Integration**: Built-in PostHog analytics (optional)
- 🔌 **Native Features**: Camera, Toast notifications, and more

## Prerequisites

- Node.js 16.x or higher
- npm 8.x or higher
- iOS development: macOS with Xcode 13+
- Android development: Android Studio with SDK 33+

## Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/aios-mobile.git
cd aios-mobile
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
```

4. Install iOS/Android platforms:
```bash
npm run sync
```

## Development

Start the development server:
```bash
npm run dev
```

Build for platforms:
```bash
# Web
npm run build

# iOS
npm run build:ios
npm run start:ios

# Android
npm run build:android
```

Run tests:
```bash
# Unit tests
npm run test.unit

# E2E tests
npm run test.e2e
```

## Project Structure

```
src/
├── components/     # Reusable UI components
├── pages/         # Application pages/routes
├── hooks/         # Custom React hooks
├── helpers/       # Utility functions
├── types/         # TypeScript definitions
└── theme/         # Global styles and theming
```

## Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow the established code patterns in `CLAUDE.md`
- Write tests for new features
- Update documentation as needed
- Follow the commit message convention

## Deployment

The application uses Firebase Hosting for web deployment. Deployments are automated via GitHub Actions:

- Pull requests trigger preview deployments
- Merges to main branch trigger production deployments

## Troubleshooting

Common issues and solutions:

- **iOS build fails**: Run `npm run clean` and try again
- **Android sync issues**: Check Android Studio SDK manager
- **Web build errors**: Clear the `.cache` directory

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact & Support

- **Issues**: Submit via GitHub Issues
- **Email**: minhvh.tech@gmail.com
- **Documentation**: [Full Documentation](https://docs.mmoment.tech)

## Acknowledgments

- [Ionic Framework](https://ionicframework.com/)
- [Capacitor](https://capacitorjs.com/)
- [React](https://reactjs.org/)
- [TailwindCSS](https://tailwindcss.com/)

---

Made with ❤️ by the AIOS Team
