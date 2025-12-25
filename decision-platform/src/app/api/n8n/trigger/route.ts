import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/middleware'

const N8N_BASE_URL = process.env.N8N_BASE_URL || 'http://localhost:5678'

export async function POST(request: NextRequest) {
  // Apply authentication
  const authResponse = await requireAuth(request)
  if (authResponse) return authResponse

  try {
    const body = await request.json()
    const { workflow, data } = body

    if (!workflow) {
      return NextResponse.json(
        { success: false, error: 'Workflow name is required' },
        { status: 400 }
      )
    }

    const webhookUrls: Record<string, string> = {
      'score-job': `${N8N_BASE_URL}/webhook/score-job`,
      'risk-assessment': `${N8N_BASE_URL}/webhook/risk-assessment`,
      'team-notification': `${N8N_BASE_URL}/webhook/team-notification`,
      'high-score-alert': `${N8N_BASE_URL}/webhook/high-score-alert`
    }

    const webhookUrl = webhookUrls[workflow]
    if (!webhookUrl) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Unknown workflow',
          availableWorkflows: Object.keys(webhookUrls)
        },
        { status: 400 }
      )
    }

    // Trigger n8n webhook
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'FA-App/1.0'
      },
      body: JSON.stringify(data || {})
    })

    if (!response.ok) {
      throw new Error(`n8n webhook failed: ${response.status} ${response.statusText}`)
    }

    const result = await response.json()

    return NextResponse.json({
      success: true,
      data: {
        workflow,
        executionId: result.executionId || 'unknown',
        status: 'triggered',
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('n8n trigger error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to trigger workflow',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Get available workflows
export async function GET(request: NextRequest) {
  const authResponse = await requireAuth(request)
  if (authResponse) return authResponse

  try {
    // Get workflow status from n8n API
    const response = await fetch(`${N8N_BASE_URL}/api/v1/workflows`, {
      headers: {
        'Authorization': `Basic ${Buffer.from('admin:admin123').toString('base64')}`
      }
    })

    if (!response.ok) {
      throw new Error('Failed to fetch workflows from n8n')
    }

    const workflows = await response.json()

    return NextResponse.json({
      success: true,
      data: {
        available: [
          'score-job',
          'risk-assessment', 
          'team-notification',
          'high-score-alert'
        ],
        n8nWorkflows: workflows.data?.map((wf: any) => ({
          id: wf.id,
          name: wf.name,
          active: wf.active,
          tags: wf.tags
        })) || []
      }
    })

  } catch (error) {
    console.error('Get workflows error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch workflows',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}