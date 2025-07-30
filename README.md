# Cognitive Assessment Games - AfricogFE

A comprehensive cognitive assessment platform featuring three interactive games designed to evaluate different cognitive abilities in children and adults.

## Overview

This application provides a sequential cognitive assessment through three carefully designed games that measure:

- **Working Memory** - Ability to hold and manipulate information in mind
- **Processing Speed** - Speed of cognitive processing and response time
- **Attention** - Selective attention and cognitive control (Stroop effect)
- **Auditory Processing** - Phonemic awareness and sound-to-spelling abilities

## Assessment Flow

1. **Age Entry** - User enters their age (required for all assessments)
2. **Game 1: Ankara Pattern** - Tests working memory and processing speed
3. **Game 2: Chameleon Colors** - Tests attention and cognitive control
4. **Game 3: Sound Spelling** - Tests auditory processing and phonemic awareness
5. **Final Assessment** - Comprehensive cognitive profile with AI predictions

---

## Game 1: Ankara Pattern (Working Memory & Processing Speed)

### How It Works

- **Objective**: Remember and repeat sequences of highlighted squares with African ankara patterns
- **Grid Sizes**: 3×3 (Easy) or 4×4 (Hard)
- **Trials**: 5 rounds with increasing difficulty
- **Age-Based Timing**:
  - Ages 5-7: 15-30 seconds per round
  - Ages 8+: 5-10 seconds per round

### Gameplay

1. Watch a sequence of squares light up with unique ankara patterns
2. Remember the exact order of the sequence
3. Click the squares in the same order they were shown
4. Each round adds one more step to the sequence
5. Continue until 5 trials are completed

### Scoring System

#### Working Memory Score (0-100)

- **Base Points**: 20 points per successful trial (100% accuracy)
- **Success Criteria**: All squares clicked in correct sequence order
- **Progressive Difficulty**: Longer sequences = same point value (maintains fairness)
- **Calculation**: `(Successful Trials / Total Trials) × 100`

#### Processing Speed Score (0-100)

- **Base Points**: 20 points per successful trial
- **Time Penalty**: -15 points for each timed-out round
- **Timeout Conditions**:
  - Ages 5-7: Failed to complete within 15-30 seconds
  - Ages 8+: Failed to complete within 5-10 seconds
- **Calculation**: `Base Score - (Timeouts × 15 points)`
- **Final Score**: Maximum 100, minimum 0

#### Scoring Examples

- **Perfect Performance**: 5/5 trials correct, no timeouts = 100 WM, 100 PS
- **Good Performance**: 4/5 trials correct, 1 timeout = 80 WM, 65 PS
- **Average Performance**: 3/5 trials correct, 2 timeouts = 60 WM, 30 PS

---

## Game 2: Chameleon Colors (Attention)

### How It Works

- **Objective**: Tap the color patch that matches the ink color, not the word meaning
- **Trials**: 5 rounds of Stroop color-word interference task
- **Colors**: RED, BLUE, GREEN, YELLOW, PURPLE
- **Trial Types**:
  - **Congruent** (40%): Word matches ink color (e.g., "RED" in red ink)
  - **Incongruent** (60%): Word differs from ink color (e.g., "BLUE" in red ink)

### Gameplay

1. See a color word displayed in colored ink
2. Ignore what the word says
3. Tap the color patch that matches the ink color
4. Receive immediate feedback
5. Complete 5 trials with mixed congruent/incongruent words

### Scoring System

#### Attention Score (0-100)

- **Base Points**: 20 points per correct response
- **Stroop Bonus**: Up to 5 additional points for handling incongruent trials well
- **Time Penalty**: Deduction for slow responses (>3 seconds average)

#### Scoring Formula

```
Base Score = (Correct Responses / Total Trials) × 100
Stroop Bonus = max(0, (Incongruent Accuracy - 0.5) × 40)
Time Penalty = min(10, max(0, (Avg Response Time - 3000) / 500))
Final Score = min(100, max(0, Base Score + Stroop Bonus - Time Penalty))
```

#### Performance Analysis

- **Congruent Accuracy**: Performance on easy trials (word matches ink)
- **Incongruent Accuracy**: Performance on hard trials (word conflicts with ink)
- **Stroop Interference**: `Congruent Accuracy - Incongruent Accuracy`
- **Response Time**: Average time to respond across all trials

---

## Game 3: Sound Spelling (Auditory Processing)

### How It Works

- **Objective**: Listen to spoken words and spell them correctly
- **Word Bank**: magazine, dinosaur, knife, tape, cave
- **Trials**: 5 rounds with visual and audio cues
- **Technology**: Web Speech API (browser-based text-to-speech)

### Gameplay

1. See a picture and description of an object
2. Click the speaker button to hear the word pronounced
3. Type the spelling of the word you heard
4. Submit your answer
5. Receive feedback on spelling accuracy and phoneme recognition

### Scoring System

#### Auditory Processing Score (0-100)

- **Perfect Spelling**: 20 points per word (100% correct)
- **Partial Credit**: Based on phonemic accuracy for near-correct spellings
- **Phoneme Analysis**: Letter-by-letter similarity assessment
- **Speed Bonus**: Up to 10 points for quick responses (<10 seconds)

#### Partial Credit System

```
Phoneme Accuracy = (Matching Letters in Correct Positions / Max Word Length) × 0.7 +
                   (Common Letters Present / Word Length) × 0.3

Partial Credit Tiers:
- >80% phoneme accuracy: 80% of full points
- >60% phoneme accuracy: 60% of full points
- >40% phoneme accuracy: 40% of full points
- >20% phoneme accuracy: 20% of full points
- <20% phoneme accuracy: 0% of full points
```

#### Bonus Systems

- **Speed Bonus**: up to 10 points
- **Phoneme Recognition**: Up to 5 bonus points per trial for good sound recognition

#### Performance Metrics

- **Perfect Spellings**: Count of exactly correct words
- **Spelling Accuracy**: Percentage of perfect spellings
- **Phoneme Accuracy**: Average phonemic similarity across all attempts
- **Response Time**: Average time to complete each word

---

## Cognitive Assessment & AI Predictions

### API Integration

After completing all games, the system makes predictions using specialized machine learning models:

#### Endpoint Structure

- **Working Memory**: `POST /predict/working-memory`
- **Processing Speed**: `POST /predict/processing-speed`
- **Attention**: `POST /predict/attention`
- **Auditory Processing**: `POST /predict/auditory-processing`

#### Request Format

```json
{
  "Age": 84, // Age in years
  "WorkingMemory_Score": 75, // 0-100 scale
  "ProcessingSpeed_Score": 80, // 0-100 scale
  "Attention_Score": 12, // 0-35 scale (inverted from UI 0-100)
  "AuditoryProcessing_Score": 65 // 0-100 scale
}
```

#### Score Scaling

- **Working Memory/Processing Speed/Auditory**: Direct 0-100 scale
- **Attention**: Inverted scaling `35 - (ui_score / 100) × 35`
  - UI Score 100 (excellent) → API Score 0 (best input)
  - UI Score 0 (poor) → API Score 35 (worst input)

#### Prediction Mappings

**Standard Mapping** (Working Memory, Processing Speed, Auditory):

- 0: "Very Low"
- 1: "Low"
- 2: "Below Average"
- 3: "Average"
- 4: "Above Average"

**Attention Mapping** (Special):

- 0: "Significant Concern"
- 1: "Likely Concern"
- 2: "Potential Concern"
- 3: "Minimal Concern"

---

## Technical Requirements

### Browser Compatibility

- **Modern Browsers**: Chrome, Firefox, Safari, Edge
- **Web Speech API**: Required for Sound Spelling game
- **Local Storage**: Used for saving game progress and scores

### Performance Considerations

- **Responsive Design**: Works on desktop, tablet, and mobile
- **Real-time Scoring**: Immediate feedback and score updates
- **Error Handling**: Graceful degradation for API failures
- **Accessibility**: Keyboard navigation and screen reader support

---

## Scoring Interpretation Guide

### Score Ranges

- **90-100**: Exceptional performance
- **80-89**: Superior performance
- **70-79**: Above average performance
- **60-69**: Average performance
- **50-59**: Below average performance
- **40-49**: Low performance
- **0-39**: Very low performance

### Age Considerations

- **Younger Children (5-7)**: Longer time limits, more forgiving scoring
- **Older Children/Adults (8+)**: Shorter time limits, standard scoring
- **Developmental Expectations**: Scores interpreted relative to age norms

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn package manager
- Modern web browser with Web Speech API support

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd africogfe

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to access the application.

### Usage

1. **Enter Age**: Required for age-appropriate timing and assessment
2. **Play Games Sequentially**: Complete all three games in order
3. **Review Results**: Automatic cognitive assessment after completion
4. **Retake Available**: Can repeat individual games or entire assessment

---

## Data Privacy & Security

- **Local Processing**: All scoring calculations performed client-side
- **Minimal Data**: Only age and scores sent to prediction API
- **No Personal Information**: No names, addresses, or identifying data collected
- **Session-Based**: Data not persisted between browser sessions (except local high scores)

---

## Development

### Project Structure

```
app/
├── components/           # React components
│   ├── GameGrid.tsx         # Ankara Pattern game
│   ├── ChameleonColorsGame.tsx  # Attention game
│   ├── PhonicsSpellingGame.tsx  # Auditory processing game
│   ├── ScoreTracker.tsx     # Score display and tracking
│   ├── WorkingMemoryScorer.ts   # Working memory scoring logic
│   ├── ProcessingSpeedScorer.ts # Processing speed scoring logic
│   ├── AttentionScorer.ts       # Attention scoring logic
│   └── AuditoryProcessingScorer.ts # Auditory processing scoring logic
├── page.tsx             # Main application page
└── globals.css          # Global styles
```

### Key Technologies

- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Web Speech API**: Text-to-speech functionality

### Build Commands

```bash
npm run dev      # Development server
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

---

## API Documentation

### Prediction Endpoints

All endpoints expect POST requests with JSON payloads containing age and relevant scores.

#### Working Memory Prediction

```bash
POST /predict/working-memory
Content-Type: application/json

{
  "Age": 25,
  "WorkingMemory_Score": 85
}
```

#### Processing Speed Prediction

```bash
POST /predict/processing-speed
Content-Type: application/json

{
  "Age": 25,
  "ProcessingSpeed_Score": 75
}
```

#### Attention Prediction

```bash
POST /predict/attention
Content-Type: application/json

{
  "Age": 25,
  "Attention_Score": 8  // 0-35 scale
}
```

#### Auditory Processing Prediction

```bash
POST /predict/auditory-processing
Content-Type: application/json

{
  "Age": 25,
  "AuditoryProcessing_Score": 90
}
```

All endpoints return:

```json
{
  "predicted": 3 // Integer prediction value
}
```

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Create a Pull Request

---

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## Acknowledgments

- African ankara patterns used in the working memory game
- Stroop effect research for attention assessment design
- Web Speech API for accessibility and audio processing
- Clinical psychology research informing scoring methodologies
