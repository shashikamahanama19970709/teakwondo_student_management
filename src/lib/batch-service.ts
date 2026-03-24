import connectDB from '@/lib/db-config'
import { Project } from '@/models/Project'
import { User } from '@/models/User'

export class BatchService {
  /**
   * Update badge statuses for completed batches
   */
  static async updateCompletedBadges() {
    try {
      await connectDB()

      const now = new Date()

      // Find all projects with batches that have ended
      const projects = await Project.find({
        'groups.batches.timeline.endDate': { $lte: now },
        'groups.batches.badge.status': 'ONGOING'
      })

      let updatedCount = 0

      for (const project of projects) {
        for (const group of project.groups) {
          for (const batch of group.batches) {
            if (batch.badge.status === 'ONGOING' && new Date(batch.timeline.endDate) <= now) {
              // Mark batch as completed
              batch.badge.status = 'COMPLETED'

              // Update all students in this batch to EARNED status
              await User.updateMany(
                {
                  'enrolledCourses.batchId': batch._id,
                  'enrolledCourses.badgeStatus': 'NOT_EARNED'
                },
                {
                  $set: {
                    'enrolledCourses.$.badgeStatus': 'EARNED'
                  }
                }
              )

              updatedCount++
            }
          }
        }

        await project.save()
      }

      return { success: true, updatedBatches: updatedCount }
    } catch (error) {
      console.error('Error updating completed badges:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, error: errorMessage }
    }
  }

  /**
   * Manually complete a batch and award badges
   */
  static async completeBatch(projectId: string, groupName: string, batchId: string) {
    try {
      await connectDB()

      const project = await Project.findOne({
        _id: projectId,
        'groups.name': groupName,
        'groups.batches._id': batchId
      })

      if (!project) {
        return { success: false, error: 'Batch not found' }
      }

      // Find and update the batch
      const group = project.groups.find((g: any) => g.name === groupName)
      const batch = group?.batches.find((b: any) => b._id.toString() === batchId)

      if (!batch) {
        return { success: false, error: 'Batch not found' }
      }

      if (batch.badge.status === 'COMPLETED') {
        return { success: false, error: 'Batch is already completed' }
      }

      batch.badge.status = 'COMPLETED'

      // Update all students in this batch to EARNED status
      await User.updateMany(
        {
          'enrolledCourses.batchId': batch._id,
          'enrolledCourses.badgeStatus': 'NOT_EARNED'
        },
        {
          $set: {
            'enrolledCourses.$.badgeStatus': 'EARNED'
          }
        }
      )

      await project.save()

      return { success: true, message: 'Batch completed and badges awarded' }
    } catch (error) {
      console.error('Error completing batch:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, error: errorMessage }
    }
  }

  /**
   * Get batch details with student information
   */
  static async getBatchDetails(projectId: string, groupName: string, batchId: string) {
    try {
      await connectDB()

      const project = await Project.findOne({
        _id: projectId,
        'groups.name': groupName,
        'groups.batches._id': batchId
      })

      if (!project) {
        return { success: false, error: 'Batch not found' }
      }

      const group = project.groups.find((g: any) => g.name === groupName)
      const batch = group?.batches.find((b: any) => b._id.toString() === batchId)

      if (!batch) {
        return { success: false, error: 'Batch not found' }
      }

      // Get students in this batch
      const students = await User.find({
        'enrolledCourses.batchId': batch._id
      }).select('firstName lastName email enrolledCourses')

      const batchStudents = students.map((student: any) => {
        const enrollment = student.enrolledCourses.find((ec: any) => ec.batchId?.toString() === batchId)
        return {
          _id: student._id,
          firstName: student.firstName,
          lastName: student.lastName,
          email: student.email,
          badgeStatus: enrollment?.badgeStatus || 'NOT_EARNED',
          enrolledAt: enrollment?.enrolledAt
        }
      })

      return {
        success: true,
        data: {
          batch,
          students: batchStudents
        }
      }
    } catch (error) {
      console.error('Error getting batch details:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, error: errorMessage }
    }
  }
}