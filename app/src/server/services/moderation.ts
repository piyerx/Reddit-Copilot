import { reddit } from '@devvit/web/server';

export interface ModerationActionResult {
  success: boolean;
  message: string;
  action: 'approve' | 'remove' | 'warn';
  postId: string;
}

export class ModerationService {
  /**
   * Approve a post or comment
   */
  static async approveItem(postId: string): Promise<ModerationActionResult> {
    try {
      // Handle both posts (t3_) and comments (t1_)
      const fullId = postId.startsWith('t') ? (postId as `t3_${string}` | `t1_${string}`) : (`t3_${postId}` as `t3_${string}`);
      
      const item = await reddit.getPostById(fullId);
      if (!item) {
        return {
          success: false,
          message: 'Item not found',
          action: 'approve',
          postId,
        };
      }

      await item.approve();
      
      return {
        success: true,
        message: 'Item approved successfully',
        action: 'approve',
        postId,
      };
    } catch (error) {
      console.error(`Error approving item ${postId}:`, error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to approve item',
        action: 'approve',
        postId,
      };
    }
  }

  /**
   * Remove a post or comment with optional removal reason
   */
  static async removeItem(postId: string, reason?: string): Promise<ModerationActionResult> {
    try {
      const fullId = postId.startsWith('t') ? (postId as `t3_${string}` | `t1_${string}`) : (`t3_${postId}` as `t3_${string}`);
      
      const item = await reddit.getPostById(fullId);
      if (!item) {
        return {
          success: false,
          message: 'Item not found',
          action: 'remove',
          postId,
        };
      }

      // Remove the item (spam=false for regular removal, not spam)
      await item.remove(false);

      // If there's a removal reason, send a comment to the user
      if (reason) {
        try {
          const author = (item as any).authorName;
          if (author && author !== 'deleted') {
            // Send removal reason as a PM to the user
            await reddit.sendPrivateMessage({
              to: author,
              subject: 'Your post was removed',
              text: reason,
            });
          }
        } catch (pmError) {
          console.warn('Could not send removal reason PM:', pmError);
          // Don't fail the removal if PM fails
        }
      }

      return {
        success: true,
        message: 'Item removed successfully',
        action: 'remove',
        postId,
      };
    } catch (error) {
      console.error(`Error removing item ${postId}:`, error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to remove item',
        action: 'remove',
        postId,
      };
    }
  }

  /**
   * Send a warning to the post/comment author
   */
  static async warnUser(postId: string, warningMessage: string): Promise<ModerationActionResult> {
    try {
      const fullId = postId.startsWith('t') ? (postId as `t3_${string}` | `t1_${string}`) : (`t3_${postId}` as `t3_${string}`);
      
      const item = await reddit.getPostById(fullId);
      if (!item) {
        return {
          success: false,
          message: 'Item not found',
          action: 'warn',
          postId,
        };
      }

      const author = (item as any).authorName;
      if (!author || author === 'deleted') {
        return {
          success: false,
          message: 'Cannot warn deleted user',
          action: 'warn',
          postId,
        };
      }

      // Send warning via private message
      await reddit.sendPrivateMessage({
        to: author,
        subject: 'Warning from moderators',
        text: warningMessage,
      });

      return {
        success: true,
        message: 'Warning sent successfully',
        action: 'warn',
        postId,
      };
    } catch (error) {
      console.error(`Error warning user for post ${postId}:`, error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to send warning',
        action: 'warn',
        postId,
      };
    }
  }
}

export const moderationService = new ModerationService();
