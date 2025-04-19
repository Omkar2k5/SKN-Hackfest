'use client'

import React from 'react'
import { PDFViewer as PDFView } from '@react-pdf/renderer'
import { Document, DocumentProps } from '@react-pdf/renderer'

interface PDFViewerProps {
  children: React.ReactElement<DocumentProps>
}

export function PDFViewer({ children }: PDFViewerProps) {
  return (
    <PDFView style={{ width: '100%', height: '80vh' }}>
      {children}
    </PDFView>
  )
} 