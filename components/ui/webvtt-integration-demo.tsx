/**
 * WebVTT Integration Demo Component
 * Demonstrates WebVTT parsing, text transformation, and error handling
 */

import * as React from "react"
import { InteractiveTranscript } from "./interactive-transcript"
import { type TextTransformOptions } from "@/lib/types/transcript"

/**
 * Sample WebVTT content for demonstration
 */
const SAMPLE_WEBVTT = `WEBVTT

00:00.000 --> 00:05.000
<v Speaker 1>Hello and welcome to our interactive transcript demo.

00:05.000 --> 00:10.000
<v Speaker 2>This WebVTT content is being parsed and displayed in real-time.

00:10.000 --> 00:15.000
<v Speaker 1>You can search through the content and navigate between results.

00:15.000 --> 00:20.000
<v Speaker 2>The component supports both WebVTT format and plain text transformation.

00:20.000 --> 00:25.000
<v Speaker 1>Try searching for specific words or phrases to see the highlighting in action.`

/**
 * Sample plain text for transformation
 */
const SAMPLE_TEXT = `Speaker A: Welcome to our comprehensive transcript system demonstration. This system can handle various input formats and transform them into interactive transcripts.

Speaker B: That's right! We support WebVTT format parsing, plain text transformation, and even custom timing configurations. The system is built with accessibility and performance in mind.

Speaker A: Users can search through transcripts, navigate between results, and interact with individual segments. Everything is keyboard accessible and screen reader friendly.

Speaker B: The component also includes comprehensive error handling, loading states, and validation for different data formats. It's designed to be robust and user-friendly.`

/**
 * Demo props
 */
export interface WebVTTIntegrationDemoProps {
  /** Demo title */
  title?: string
  /** Whether to show controls */
  showControls?: boolean
  /** Custom CSS class */
  className?: string
}

/**
 * WebVTT Integration Demo component
 */
export const WebVTTIntegrationDemo: React.FC<WebVTTIntegrationDemoProps> = ({
  title = "WebVTT Integration Demo",
  showControls = true,
  className
}) => {
  const [currentData, setCurrentData] = React.useState<string>(SAMPLE_WEBVTT)
  const [dataType, setDataType] = React.useState<'webvtt' | 'text'>('webvtt')
  const [transformOptions, setTransformOptions] = React.useState<TextTransformOptions>({
    segmentDuration: 4,
    speakerDetection: true,
    timestampFormat: 'timecode'
  })
  const [errors, setErrors] = React.useState<string[]>([])
  const [warnings, setWarnings] = React.useState<string[]>([])
  const [isLoading, setIsLoading] = React.useState(false)

  // Handle data type change
  const handleDataTypeChange = (type: 'webvtt' | 'text') => {
    setDataType(type)
    setCurrentData(type === 'webvtt' ? SAMPLE_WEBVTT : SAMPLE_TEXT)
    setErrors([])
    setWarnings([])
  }

  // Handle custom data input
  const handleDataChange = (newData: string) => {
    setCurrentData(newData)
    setErrors([])
    setWarnings([])
  }

  // Handle transform options change
  const handleTransformOptionsChange = (options: Partial<TextTransformOptions>) => {
    setTransformOptions(prev => ({ ...prev, ...options }))
  }

  // Error handler
  const handleError = (error: Error) => {
    setErrors(prev => [...prev, error.message])
  }

  // Warning handler
  const handleWarning = (newWarnings: string[]) => {
    setWarnings(prev => [...prev, ...newWarnings])
  }

  // Loading handler
  const handleLoadingChange = (loading: boolean) => {
    setIsLoading(loading)
  }

  return (
    <div className={`space-y-6 ${className || ''}`}>
      {/* Demo Title */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">{title}</h2>
        <p className="text-muted-foreground">
          Demonstrating WebVTT parsing, text transformation, and error handling
        </p>
      </div>

      {/* Controls */}
      {showControls && (
        <div className="space-y-4 p-4 border rounded-lg bg-card">
          <h3 className="text-lg font-semibold">Demo Controls</h3>

          {/* Data Type Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Data Format:</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="dataType"
                  value="webvtt"
                  checked={dataType === 'webvtt'}
                  onChange={() => handleDataTypeChange('webvtt')}
                  className="rounded border-input"
                />
                <span className="text-sm">WebVTT Format</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="dataType"
                  value="text"
                  checked={dataType === 'text'}
                  onChange={() => handleDataTypeChange('text')}
                  className="rounded border-input"
                />
                <span className="text-sm">Plain Text</span>
              </label>
            </div>
          </div>

          {/* Transform Options (for plain text) */}
          {dataType === 'text' && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Text Transform Options:</h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium">Segment Duration (seconds):</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    step="0.5"
                    value={transformOptions.segmentDuration}
                    onChange={(e) => handleTransformOptionsChange({
                      segmentDuration: parseFloat(e.target.value)
                    })}
                    className="w-full px-2 py-1 text-sm border rounded"
                  />
                </div>

                <div className="space-y-1">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={transformOptions.speakerDetection}
                      onChange={(e) => handleTransformOptionsChange({
                        speakerDetection: e.target.checked
                      })}
                      className="rounded border-input"
                    />
                    <span className="text-xs font-medium">Speaker Detection</span>
                  </label>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium">Timestamp Format:</label>
                  <select
                    value={transformOptions.timestampFormat}
                    onChange={(e) => handleTransformOptionsChange({
                      timestampFormat: e.target.value as 'seconds' | 'timecode'
                    })}
                    className="w-full px-2 py-1 text-sm border rounded"
                  >
                    <option value="timecode">Timecode (HH:MM:SS)</option>
                    <option value="seconds">Seconds</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Custom Data Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Custom {dataType === 'webvtt' ? 'WebVTT' : 'Text'} Data:
            </label>
            <textarea
              value={currentData}
              onChange={(e) => handleDataChange(e.target.value)}
              placeholder={`Enter your ${dataType === 'webvtt' ? 'WebVTT' : 'plain text'} content here...`}
              className="w-full h-32 px-3 py-2 text-sm border rounded-md resize-none font-mono"
            />
          </div>
        </div>
      )}

      {/* Status Messages */}
      {(errors.length > 0 || warnings.length > 0 || isLoading) && (
        <div className="space-y-2">
          {/* Loading */}
          {isLoading && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Processing transcript data...
              </p>
            </div>
          )}

          {/* Errors */}
          {errors.length > 0 && (
            <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
              <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">
                Errors:
              </h4>
              <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                {errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Warnings */}
          {warnings.length > 0 && (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                Warnings:
              </h4>
              <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                {warnings.map((warning, index) => (
                  <li key={index}>• {warning}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Interactive Transcript */}
      <div className="border rounded-lg">
        <InteractiveTranscript
          data={currentData}
          textTransformOptions={dataType === 'text' ? transformOptions : undefined}
          searchable={true}
          scrollable={true}
          bordered={false}
          maxHeight="400px"
          showTimestamps={true}
          showSpeakers={true}
          onError={handleError}
          onWarning={handleWarning}
          onLoadingChange={handleLoadingChange}
          onCueClick={(cue) => {
            console.log('Cue clicked:', cue)
          }}
          onSearch={(query, results) => {
            console.log('Search performed:', { query, resultCount: results.length })
          }}
          className="p-4"
        />
      </div>

      {/* Usage Instructions */}
      <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-4">
        <h3 className="font-medium mb-2">Usage Instructions:</h3>
        <ul className="space-y-1 text-xs">
          <li>• Switch between WebVTT and plain text formats using the radio buttons</li>
          <li>• Modify the text content in the textarea to see real-time parsing</li>
          <li>• For plain text, adjust transform options to control segment timing and speaker detection</li>
          <li>• Use the search functionality to find and navigate through content</li>
          <li>• Click on transcript segments to interact with them</li>
          <li>• Observe error and warning messages for invalid data formats</li>
        </ul>
      </div>
    </div>
  )
}

export default WebVTTIntegrationDemo