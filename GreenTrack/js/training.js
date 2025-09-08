import { db } from './db.js';
import { auth } from './auth.js';
import { router } from './router.js';
import { showToast, showModal, hideModal } from './utils.js';

class Training {
    constructor() {
        this.modules = [
            {
                id: 'module-1',
                title: 'Waste Segregation',
                content: `
                    <h3>Learn to Segregate Waste Properly</h3>
                    <p>Proper waste segregation is the first step towards effective waste management.</p>
                    <h4>Categories:</h4>
                    <ul>
                        <li><strong>Wet Waste:</strong> Food scraps, vegetable peels, garden waste</li>
                        <li><strong>Dry Waste:</strong> Paper, plastic, metal, glass</li>
                        <li><strong>Hazardous Waste:</strong> Batteries, medicines, chemicals</li>
                    </ul>
                    <p>Always use separate bins for different types of waste to make recycling more effective.</p>
                `
            },
            {
                id: 'module-2',
                title: 'Home Composting',
                content: `
                    <h3>Create Compost at Home</h3>
                    <p>Turn your kitchen waste into nutrient-rich compost for plants.</p>
                    <h4>Steps:</h4>
                    <ol>
                        <li>Collect organic waste (vegetable peels, fruit scraps)</li>
                        <li>Layer with dry leaves or paper</li>
                        <li>Add water to maintain moisture</li>
                        <li>Turn the mixture regularly</li>
                        <li>Harvest compost in 2-3 months</li>
                    </ol>
                    <p>Composting reduces waste and creates valuable fertilizer!</p>
                `
            },
            {
                id: 'module-3',
                title: 'Safe Disposal Methods',
                content: `
                    <h3>Safe Waste Disposal Practices</h3>
                    <p>Some waste requires special handling to prevent environmental damage.</p>
                    <h4>Special Disposal:</h4>
                    <ul>
                        <li><strong>E-waste:</strong> Take to certified e-waste centers</li>
                        <li><strong>Batteries:</strong> Return to authorized dealers</li>
                        <li><strong>Medicines:</strong> Return to pharmacies or hospitals</li>
                        <li><strong>Paint/Chemicals:</strong> Contact hazardous waste facilities</li>
                    </ul>
                    <p>Never throw hazardous waste in regular bins - it can contaminate the environment!</p>
                `
            }
        ];

        this.quiz = {
            questions: [
                {
                    question: "Which bin should you use for vegetable peels?",
                    options: ["Dry waste bin", "Wet waste bin", "Hazardous waste bin"],
                    correct: 1
                },
                {
                    question: "How long does it typically take to make compost at home?",
                    options: ["1 week", "2-3 months", "1 year"],
                    correct: 1
                },
                {
                    question: "Where should you dispose of old batteries?",
                    options: ["Regular dustbin", "Wet waste bin", "Authorized dealers"],
                    correct: 2
                },
                {
                    question: "What should you do with expired medicines?",
                    options: ["Throw in dustbin", "Return to pharmacy", "Bury in garden"],
                    correct: 1
                },
                {
                    question: "Why is waste segregation important?",
                    options: ["Makes recycling easier", "Looks organized", "Reduces smell"],
                    correct: 0
                }
            ]
        };
    }

    getProgress(userId) {
        const progress = db.getAll('trainingProgress');
        return progress.find(p => p.userId === userId) || {
            userId,
            modulesCompleted: [],
            quizScore: null,
            certified: false
        };
    }

    completeModule(userId, moduleId) {
        let progress = this.getProgress(userId);

        if (!progress.modulesCompleted.includes(moduleId)) {
            progress.modulesCompleted.push(moduleId);

            // Update in database
            const existing = db.findBy('trainingProgress', p => p.userId === userId);
            if (existing.length > 0) {
                db.updateById('trainingProgress', existing[0].id, progress);
            } else {
                db.add('trainingProgress', progress);
            }

            // Award points
            this.awardPoints(userId, 5);
            showToast('Module completed! +5 points');
        }
    }

    submitQuiz(userId, answers) {
        let score = 0;
        answers.forEach((answer, index) => {
            if (answer === this.quiz.questions[index].correct) {
                score++;
            }
        });

        const percentage = (score / this.quiz.questions.length) * 100;
        let progress = this.getProgress(userId);
        progress.quizScore = percentage;

        if (percentage >= 60 && progress.modulesCompleted.length === this.modules.length) {
            progress.certified = true;
            this.awardPoints(userId, 20);
            db.updateById('users', userId, { trained: true });
            showToast('Congratulations! You are now Green Certified! +20 points', 'success');
        }

        // Update progress
        const existing = db.findBy('trainingProgress', p => p.userId === userId);
        if (existing.length > 0) {
            db.updateById('trainingProgress', existing[0].id, progress);
        } else {
            db.add('trainingProgress', progress);
        }

        return { score, percentage, certified: progress.certified };
    }

    awardPoints(userId, points) {
        const user = db.findById('users', userId);
        if (user) {
            db.updateById('users', userId, { points: (user.points || 0) + points });
        }
    }

    renderTraining() {
        if (!auth.requireRole('citizen')) return;

        const progress = this.getProgress(auth.currentUser.id);
        const completedCount = progress.modulesCompleted.length;
        const totalModules = this.modules.length;
        const progressPercentage = (completedCount / totalModules) * 100;

        return `
            <div class="card">
                <div class="card-header">
                    <h1>🌱 Green Training Program</h1>
                    ${progress.certified ? '<span class="badge success">Green Certified</span>' : ''}
                </div>

                <div class="progress">
                    <div class="progress-bar" style="width: ${progressPercentage}%"></div>
                </div>
                <p>Progress: ${completedCount}/${totalModules} modules completed</p>

                <div class="grid grid-3">
                    ${this.modules.map(module => `
                        <div class="card">
                            <h3>${module.title}</h3>
                            ${progress.modulesCompleted.includes(module.id) ?
                                '<span class="badge success">Completed</span>' :
                                `<button class="btn" onclick="training.viewModule('${module.id}')">Start Module</button>`
                            }
                        </div>
                    `).join('')}
                </div>

                ${completedCount === totalModules && !progress.certified ? `
                    <div class="card" style="border: 2px solid var(--warning-color);">
                        <h3>📝 Take the Quiz</h3>
                        <p>Complete all modules! Now take the quiz to get certified.</p>
                        <button class="btn btn-warning" onclick="training.startQuiz()">Start Quiz</button>
                    </div>
                ` : ''}

                ${progress.certified ? `
                    <div class="card" style="border: 2px solid var(--success-color);">
                        <h3>🏆 Congratulations!</h3>
                        <p>You are now <strong>Green Certified</strong>!</p>
                        <p>Quiz Score: ${progress.quizScore}%</p>
                    </div>
                ` : ''}
            </div>
        `;
    }

    viewModule(moduleId) {
        const module = this.modules.find(m => m.id === moduleId);
        if (!module) return;

        showModal(module.title, `
            ${module.content}
            <div style="margin-top: 2rem;">
                <button class="btn btn-success" onclick="training.completeModule('${auth.currentUser.id}', '${moduleId}'); hideModal(); router.handleRoute();">
                    Complete Module
                </button>
            </div>
        `);
    }

    startQuiz() {
        let currentQuestion = 0;
        const answers = [];

        const showQuestion = () => {
            if (currentQuestion >= this.quiz.questions.length) {
                // Submit quiz
                const result = this.submitQuiz(auth.currentUser.id, answers);
                showModal('Quiz Results', `
                    <h3>Quiz Completed!</h3>
                    <p>Your Score: ${result.score}/${this.quiz.questions.length} (${result.percentage.toFixed(1)}%)</p>
                    ${result.certified ?
                        '<p class="text-success">🎉 Congratulations! You are now Green Certified!</p>' :
                        '<p class="text-error">You need 60% or higher to get certified. Try again!</p>'
                    }
                `, [{
                    text: 'Continue',
                    onclick: 'hideModal(); router.handleRoute();'
                }]);
                return;
            }

            const question = this.quiz.questions[currentQuestion];
            showModal(`Question ${currentQuestion + 1}/${this.quiz.questions.length}`, `
                <h3>${question.question}</h3>
                <div style="margin: 1rem 0;">
                    ${question.options.map((option, index) => `
                        <label style="display: block; margin: 0.5rem 0;">
                            <input type="radio" name="answer" value="${index}" style="margin-right: 0.5rem;">
                            ${option}
                        </label>
                    `).join('')}
                </div>
            `, [{
                text: 'Next',
                class: 'btn-success',
                onclick: `
                    const selected = document.querySelector('input[name="answer"]:checked');
                    if (!selected) {
                        alert('Please select an answer');
                        return;
                    }
                    training.quiz.answers[${currentQuestion}] = parseInt(selected.value);
                    training.quiz.currentQuestion = ${currentQuestion + 1};
                    hideModal();
                    setTimeout(() => training.startQuiz(), 100);
                `
            }]);
        };

        // Store quiz state
        this.quiz.currentQuestion = currentQuestion;
        this.quiz.answers = answers;
        showQuestion();
    }
}

const training = new Training();
export { training };
