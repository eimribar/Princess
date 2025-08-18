import { NotificationEntity } from '@/components/notifications/NotificationCenter';

export async function initializeSampleNotifications() {
  try {
    // Check if notifications already exist
    const existing = await NotificationEntity.list();
    if (existing && existing.length > 0) {
      console.log('Sample notifications already exist');
      return;
    }

    console.log('Creating sample notifications...');

    // Create sample notifications to demonstrate functionality
    const sampleNotifications = [
      {
        type: 'version_upload',
        title: 'New Version Uploaded',
        message: 'New version V1 uploaded for "Logo Design Concepts"',
        data: {
          deliverable_id: 'deliv_001',
          deliverable_name: 'Logo Design Concepts',
          version_number: 'V1',
          version_id: 'v_001',
          uploaded_by: 'Sarah Johnson'
        },
        recipient: 'all',
        priority: 'normal',
        created_date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
      },
      {
        type: 'approval_request',
        title: 'Approval Requested',
        message: 'Approval requested for version V0 of "Brand Strategy Document"',
        data: {
          deliverable_id: 'deliv_002',
          deliverable_name: 'Brand Strategy Document',
          version_number: 'V0',
          version_id: 'v_002',
          requested_by: 'Mike Chen'
        },
        recipient: 'approvers',
        priority: 'high',
        created_date: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString() // 1 hour ago
      },
      {
        type: 'version_approved',
        title: 'Version Approved',
        message: 'Version V1 approved for "Color Palette"',
        data: {
          deliverable_id: 'deliv_003',
          deliverable_name: 'Color Palette',
          version_number: 'V1',
          version_id: 'v_003',
          approved_by: 'John Smith'
        },
        recipient: 'team',
        priority: 'normal',
        created_date: new Date(Date.now() - 30 * 60 * 1000).toISOString() // 30 minutes ago
      },
      {
        type: 'comment_added',
        title: 'New Comment',
        message: 'New comment added to "Website Mockup"',
        data: {
          deliverable_id: 'deliv_004',
          deliverable_name: 'Website Mockup',
          comment_id: 'c_001',
          comment_content: 'This looks great! Can we adjust the header spacing?',
          comment_by: 'Emma Davis'
        },
        recipient: 'team',
        priority: 'low',
        created_date: new Date(Date.now() - 15 * 60 * 1000).toISOString() // 15 minutes ago
      },
      {
        type: 'version_declined',
        title: 'Version Declined',
        message: 'Version V0 declined for "Social Media Graphics"',
        data: {
          deliverable_id: 'deliv_005',
          deliverable_name: 'Social Media Graphics',
          version_number: 'V0',
          version_id: 'v_005',
          declined_by: 'Maya Cohen',
          feedback: 'Please adjust the color scheme to match brand guidelines'
        },
        recipient: 'uploader',
        priority: 'high',
        created_date: new Date(Date.now() - 5 * 60 * 1000).toISOString() // 5 minutes ago
      }
    ];

    // Create each notification
    for (const notificationData of sampleNotifications) {
      await NotificationEntity.create(notificationData);
    }

    console.log(`Created ${sampleNotifications.length} sample notifications`);
    return sampleNotifications.length;

  } catch (error) {
    console.error('Failed to initialize sample notifications:', error);
    return 0;
  }
}