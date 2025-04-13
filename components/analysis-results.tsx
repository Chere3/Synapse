'use client'

import { RiskAnalysis } from '@/utils/analysis'
import { Domine } from 'next/font/google'

const domine = Domine({preload: true, subsets: ['latin']})

interface AnalysisResultsProps {
  analysis: RiskAnalysis[]
}

const getRiskColor = (riskLevel: number) => {
  switch (riskLevel) {
    case 1:
      return 'text-green-600'
    case 2:
      return 'text-green-500'
    case 3:
      return 'text-yellow-500'
    case 4:
      return 'text-orange-600'
    case 5:
      return 'text-red-700'
    default:
      return 'text-gray-600'
  }
}

const getRiskLabel = (riskLevel: number) => {
  switch (riskLevel) {
    case 1:
      return 'Minimal Risk'
    case 2:
      return 'Low Risk'
    case 3:
      return 'Moderate Risk'
    case 4:
      return 'High Risk'
    case 5:
      return 'Critical Risk'
    default:
      return 'Unknown Risk'
  }
}

export default function AnalysisResults({ analysis }: AnalysisResultsProps) {
  return (
    <div className="bg-white rounded-lg p-6">
      <div className="max-h-[calc(100vh-300px)] overflow-y-auto scrollbar-hide space-y-4">
        {analysis.map((item, index) => (
          <div
            key={index}
            className="bg-gray-50 rounded-lg p-4 space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className={`text-2xl font-medium ${getRiskColor(item.riskLevel)} ${domine.className} `}>
                {getRiskLabel(item.riskLevel)}
              </span>
              <span className={`text-2xl font-bold ${getRiskColor(item.riskLevel)} ${domine.className}`}>
                {item.riskLevel}
              </span>
            </div>
            <div className="space-y-2">
              <h3 className={`text-sm font-medium text-gray-500 ${domine.className}`}>Clause Text</h3>
              <p className="italic text-gray-700">{item.clause}</p>
            </div>
            <div className="space-y-2">
              <h3 className={`text-sm font-medium text-gray-500 ${domine.className}`}>Explanation</h3>
              <p className="text-gray-700">{item.explanation}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 