# Dropout-Predictor

---



1. **Clone the repository:**

```bash
git clone https://github.com/harshlamba18/AI-Debate-judge.git
```

 
2. **Navigate to the backend directory:**

```bash
cd AI-Debate-judge/backend
```

3. **Create your environment filet**

```bash
cp .env.example .env
JWT_SECRET="replace_this_with_a_very_strong_random_secret"
```

4.**Run the backend Server**

```bash
npm install
npm run dev
```

5.**Navigate to frontend directory**

```bash
cd AI-Debate-judge/frontend
cp .env.example .env.local
npm install
```

6. **Run the frontend Server**

```bash
npm run dev
```

7. **To test the real-time features of the application (like a chat or debate), you need to simulate two different users.

Open your first browser (e.g., Chrome) and go to:
http://localhost:3000

Open a second, different browser (e.g., Firefox, Safari) or a private/incognito window in your first browser. Go to the same address:
http://localhost:3000

You can now use the application from both browser windows as if you were two separate users.**