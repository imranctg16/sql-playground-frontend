import React from 'react';
import { Question } from '../types';

interface QuestionListProps {
  questions: Question[];
  selectedQuestion: Question | null;
  onQuestionSelect: (question: Question) => void;
}

const QuestionList: React.FC<QuestionListProps> = ({
  questions,
  selectedQuestion,
  onQuestionSelect,
}) => {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'hard':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold text-gray-800">Questions</h2>
        <p className="text-sm text-gray-600">{questions.length} available</p>
      </div>
      <div className="max-h-screen overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
        {questions.map((question) => (
          <div
            key={question.id}
            onClick={() => onQuestionSelect(question)}
            className={`p-4 border-b cursor-pointer transition-colors relative ${
              selectedQuestion?.id === question.id
                ? 'bg-blue-50 border-blue-200'
                : question.completed
                ? 'bg-green-50 hover:bg-green-100 border-green-200'
                : 'hover:bg-gray-50'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className={`font-medium ${question.completed ? 'text-green-800' : 'text-gray-900'}`}>
                    {question.title}
                  </h3>
                  {question.completed && (
                    <span className="text-green-600 text-lg font-bold">
                      ✓
                    </span>
                  )}
                </div>
                <p className={`text-sm mb-2 line-clamp-2 ${question.completed ? 'text-green-700' : 'text-gray-600'}`}>
                  {question.description}
                </p>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(
                      question.difficulty
                    )}`}
                  >
                    {question.difficulty}
                  </span>
                  <span className={`text-xs ${question.completed ? 'text-green-600' : 'text-gray-500'}`}>
                    {question.points} points
                  </span>
                  {question.completed && (
                    <span className="text-xs text-green-600 font-bold bg-green-100 px-2 py-1 rounded-full">
                      ✓ Completed
                    </span>
                  )}
                </div>
              </div>
              {question.completed && (
                <div className="ml-3 flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-bold text-lg">✓</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        {questions.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No questions found for the selected difficulty level.
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionList;