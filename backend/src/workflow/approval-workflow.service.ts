import { Injectable, Logger, BadRequestException } from '@nestjs/common';

export interface ApprovalRequestPayload {
  approvalId: string;
  module: string;
  action: string;
  requesterId: string;
  approverId?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  submittedAt: string;
  decidedAt?: string;
  comments?: string;
}

@Injectable()
export class ApprovalWorkflowService {
  private readonly logger = new Logger(ApprovalWorkflowService.name);

  /**
   * Validate Segregation of Duties (requester and approver MUST be different users)
   */
  validateSegregationOfDuties(requesterId: string, approverId: string): void {
    if (requesterId && approverId && requesterId.trim().toLowerCase() === approverId.trim().toLowerCase()) {
      throw new BadRequestException(
        `Segregation of duties violation: Requester (${requesterId}) cannot approve their own operational action.`,
      );
    }
  }

  /**
   * Process an approval decision
   */
  processDecision(params: {
    approvalId: string;
    module: string;
    action: string;
    requesterId: string;
    approverId: string;
    decision: 'APPROVED' | 'REJECTED';
    comments?: string;
  }): ApprovalRequestPayload {
    this.validateSegregationOfDuties(params.requesterId, params.approverId);

    const result: ApprovalRequestPayload = {
      approvalId: params.approvalId,
      module: params.module,
      action: params.action,
      requesterId: params.requesterId,
      approverId: params.approverId,
      status: params.decision,
      submittedAt: new Date().toISOString(),
      decidedAt: new Date().toISOString(),
      comments: params.comments,
    };

    this.logger.log(`[APPROVAL DECISION] ${params.decision} for ${params.module}:${params.action} by ${params.approverId}`);
    return result;
  }
}
