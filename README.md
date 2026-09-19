♻️ ECOVA

Turn your waste stream into verified impact.

Ecova is a digital recycling platform designed to connect waste generators with collectors, help identify recyclable materials, reward verified recovery, and create a traceable record of a material's journey from submission to collection and, eventually, recycling.

Instead of treating recycling as a one-time transaction, Ecova creates a connected system around the entire recovery process.

---

🌍 The Problem

Recyclable waste is generated every day by households and businesses, but a significant amount of it is still dumped, burned, or lost from the recycling chain.

Several problems contribute to this:

- People don't always know how or where to recycle specific materials.
- Waste generators and collectors are often disconnected.
- Collection processes can be difficult to track.
- Estimated quantities are difficult to verify.
- Recycling impact is rarely visible to the person generating the waste.
- Businesses and organizations lack accessible, traceable recovery data.

The result is a fragmented waste ecosystem where recyclable materials can disappear from the recovery chain.

Ecova is built to connect these missing pieces.

---

💡 What is Ecova?

Ecova is a recycling marketplace and traceability platform connecting:

Waste Generators → Collectors → Recycling Network

A user can:

1. Submit a photo of recyclable waste.
2. Get AI-assisted material identification.
3. Schedule a collection.
4. Have a collector accept and fulfill the request.
5. Record the verified weight of the collected material.
6. Receive ECO rewards based on verified recovery.
7. Track the material through its chain of custody.
8. View their cumulative environmental impact.

Core Loop

Sort → Request → Collect → Verify → Reward → Track → Recycle

---

✨ Key Features

📸 AI-Assisted Waste Identification

Users can upload an image of their waste and receive an AI-assisted material classification.

The system is designed around an important principle:

«AI identifies. Humans verify. The system records.»

AI classification is treated as an estimate. Final material classification and weight are verified during physical collection.

---

🚚 Smart Pickup Network

Waste generators can create pickup requests containing:

- Material type
- Estimated quantity
- Collection location
- Preferred time
- Waste image
- Pickup ID

Collectors can view available requests and accept collection jobs.

---

🔄 Real-Time Generator & Collector Workflow

Ecova uses a shared backend so that actions taken by one role can be reflected across the other.

Example:

Generator
    │
    │ Creates pickup
    ▼
EC-1051
    │
    ▼
Collector receives request
    │
    │ Accepts
    ▼
Generator sees "Collector Assigned"
    │
    ▼
Collection
    │
    │ Verified weight: 4.70 kg
    ▼
Reward calculated
    │
    ▼
Generator receives ECO

---

⚖️ Verified Weight & Rewards

Rewards are calculated from the verified collection weight, rather than the user's initial estimate or an AI prediction.

For the current demonstration:

1 verified kg = 100 ECO
4.70 kg = 470 ECO

«Note: The reward rate above is a demonstration rate for the MVP and does not represent a real-world monetary valuation.»

---

🔗 Chain of Custody

Every collection can maintain a chronological record of its journey.

Example:

Waste Submitted
       ↓
AI Classification
       ↓
Pickup Requested
       ↓
Collector Assigned
       ↓
Collected & Weighed
       ↓
Delivered
       ↓
Recycled
       ↓
Impact Recorded

This creates the foundation for a more transparent recycling ecosystem.

---

💰 ECO Wallet

Users can see rewards generated from verified recycling activity.

The wallet is based on reward transactions rather than simply displaying a manually assigned balance.

Future versions can connect ECO rewards to real-world incentives such as:

- Mobile data
- Electricity payments
- Cash rewards
- Partner discounts
- Other local incentives

---

🌱 Impact Passport

Ecova turns individual recycling activity into measurable environmental impact.

Users can track metricssuch as:

- Total material recovered
- Plastic diverted
- Verified collections
- Pickups completed
- Rewards earned
- Recycling activity

The long-term goal is to make environmental impact easier to understand and verify.

---

🏗️ System Architecture

Ecova is designed as a connected application rather than a collection of static dashboards.

                    ┌─────────────────┐
                    │     ECOVA       │
                    │   Web Platform  │
                    └────────┬────────┘
                             │
              ┌──────────────┴──────────────┐
              │                             │
       ┌──────▼──────┐               ┌──────▼──────┐
       │  Generator  │               │  Collector  │
       │   Portal    │               │   Portal    │
       └──────┬──────┘               └──────┬──────┘
              │                             │
              └──────────────┬──────────────┘
                             │
                     ┌───────▼────────┐
                     │    Supabase    │
                     │                │
                     │ PostgreSQL     │
                     │ Realtime       │
                     │ Storage        │
                     │ Security/RLS   │
                     └───────┬────────┘
                             │
                    ┌────────▼────────┐
                    │ Recycling       │
                    │ Network         │
                    │ / Future       │
                    │ Partners        │
                    └─────────────────┘

---

🗄️ Core Data Model

The platform is structured around persistent records rather than hardcoded UI states.

Key entities include:

- "generator_profiles"
- "collectors"
- "waste_submissions"
- "pickup_requests"
- "collection_verifications"
- "reward_transactions"
- "collector_earnings"
- "chain_of_custody_events"

This allows the same pickup record to be referenced throughout the recovery process.

---

🔐 Data & Security

Ecova is designed with production considerations in mind.

The platform includes foundations for:

- Database-level access control
- Row Level Security
- Secure image storage
- Input validation
- Controlled pickup status transitions
- Reward transaction integrity
- Duplicate submission protection
- Real-time subscription cleanup
- Environment-based API configuration
- Separation of demo and production data

Sensitive credentials and API keys should be stored as environment variables and must not be committed to the repository.

---

🛠️ Technology Stack

Frontend

- Modern web application
- Responsive UI
- Component-based architecture

Backend

- Supabase
- PostgreSQL
- Realtime subscriptions
- Storage
- Row Level Security

AI

AI-assisted image classification for recyclable material identification.

The AI layer is intentionally separated from reward verification so that an AI prediction cannot directly determine a user's final reward.

Deployment

Designed for deployment through modern web hosting platforms such as Vercel.

---

🚀 Getting Started

Prerequisites

Make sure you have:

- Node.js
- npm
- A Supabase project
- Required AI/API credentials, if enabled

Installation

Clone the repository:

git clone https://github.com/YOUR-USERNAME/ecova.git

Enter the project directory:

cd ecova

Install dependencies:

npm install

Create your environment file:

cp .env.example .env

Add the required environment variables.

Example:

VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

Then start the development server:

npm run dev

Open the local development URL shown by the terminal.

---

🔄 Example End-to-End Flow

A typical Ecova collection looks like this:

1. User uploads a photo
          ↓
2. AI identifies recyclable material
          ↓
3. User creates pickup request
          ↓
4. System generates pickup ID
          ↓
5. Collector receives request
          ↓
6. Collector accepts
          ↓
7. Generator receives real-time update
          ↓
8. Collector arrives
          ↓
9. Collector records verified weight
          ↓
10. Rewardtransaction is created
          ↓
11. Generator wallet updates
          ↓
12. Chain-of-custody record updates
          ↓
13. Environmental impact is recorded

---

🧪 Demo

The MVP demonstrates a complete Generator → Collector workflow.

Example:

Pickup: "EC-1051"

Material: PET Plastic

Verified Weight: "4.70 kg"

Demo Reward: "470 ECO"

The demo is designed to demonstrate the underlying workflow and data relationships rather than represent a fully deployed commercial recycling network.

---

🗺️ Roadmap

Current MVP

- [x] Ecova landing experience
- [x] Generator experience
- [x] Collector experience
- [x] Waste image submission
- [x] AI-assisted material identification
- [x] Pickup creation
- [x] Collector assignment
- [x] Verified weight
- [x] ECO reward calculation
- [x] Real-time role synchronization
- [x] Chain-of-custody foundation
- [x] Impact tracking

Future

- [ ] Verified collector onboarding
- [ ] Verified recycling partner onboarding
- [ ] Recycling facility integrations
- [ ] Real reward redemption
- [ ] Mobile applications
- [ ] Route optimization
- [ ] Environmental hotspot mapping
- [ ] Business sustainability dashboards
- [ ] Impact certificates
- [ ] Expansion to additional cities and countries

---

🌍 Long-Term Vision

Ecova is starting with a simple question:

«What if recyclable waste could be tracked as it moves through the recovery ecosystem?»

The long-term vision is to create infrastructure connecting waste generators, collectors, businesses, recycling facilities, and environmental organizations.

Starting in Nigeria, the underlying model can be adapted to other cities where waste collection, recycling access, and traceability remain fragmented.

Ecova is not just about collecting waste.

It is about creating a visible, verifiable, and measurable recovery network.

---

🤝 Contributing

Contributions, ideas, and feedback are welcome.

If you want to contribute:

1. Fork the repository.
2. Create a feature branch.
3. Make your changes.
4. Test your changes.
5. Submit a pull request.

Please avoid committing secrets, API keys, credentials, or private environment files.

---

📄 License

This project is currently being developed as an environmental technology project and hackathon MVP.

License details can be added as the project moves toward public/open-source release.

---

♻️ ECOVA

Turn your waste stream into verified impact.
