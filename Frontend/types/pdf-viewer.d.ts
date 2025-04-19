import { ReactElement } from 'react'
import { DocumentProps } from '@react-pdf/renderer'

export interface PDFViewerProps {
  children: ReactElement<DocumentProps>
}

export declare function PDFViewer(props: PDFViewerProps): JSX.Element 