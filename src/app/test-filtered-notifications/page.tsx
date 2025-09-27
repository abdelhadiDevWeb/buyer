"use client";
import React from 'react';
import useFilteredNotifications from '@/hooks/useFilteredNotifications';
import useAuth from '@/hooks/useAuth';

export default function TestFilteredNotificationsPage() {
  const { auth } = useAuth();
  const {
    allNotifications,
    chatNotifications,
    bellNotifications,
    chatUnreadCount,
    bellUnreadCount,
    loading,
    error,
    refresh
  } = useFilteredNotifications();

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>🔔 Filtered Database Notifications Test</h1>
      
      {/* User Info */}
      <div style={{ 
        marginBottom: '20px', 
        padding: '15px', 
        background: '#f8f9fa', 
        borderRadius: '8px' 
      }}>
        <h3>User Info</h3>
        <p><strong>User ID:</strong> {auth?.user?._id || 'Not logged in'}</p>
        <p><strong>Has Token:</strong> {auth?.tokens?.accessToken ? '✅ Yes' : '❌ No'}</p>
        <p><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</p>
        <p><strong>Error:</strong> {error || 'None'}</p>
      </div>

      {/* Summary */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '15px', 
        marginBottom: '20px' 
      }}>
        <div style={{ 
          padding: '15px', 
          background: '#e3f2fd', 
          borderRadius: '8px', 
          textAlign: 'center' 
        }}>
          <h4>📊 Total Notifications</h4>
          <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '10px 0' }}>
            {allNotifications.length}
          </p>
          <p>All notifications from database</p>
        </div>

        <div style={{ 
          padding: '15px', 
          background: '#fff3e0', 
          borderRadius: '8px', 
          textAlign: 'center' 
        }}>
          <h4>🔔 Bell Notifications</h4>
          <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '10px 0' }}>
            {bellNotifications.length}
          </p>
          <p style={{ fontSize: '16px', color: '#ff5722', fontWeight: 'bold' }}>
            Unread: {bellUnreadCount}
          </p>
          <small>BID_WON, BID_ENDED, NEW_OFFER, BID_CREATED</small>
        </div>

        <div style={{ 
          padding: '15px', 
          background: '#e8f5e8', 
          borderRadius: '8px', 
          textAlign: 'center' 
        }}>
          <h4>💬 Chat Notifications</h4>
          <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '10px 0' }}>
            {chatNotifications.length}
          </p>
          <p style={{ fontSize: '16px', color: '#4caf50', fontWeight: 'bold' }}>
            Unread: {chatUnreadCount}
          </p>
          <small>CHAT_CREATED</small>
        </div>
      </div>

      {/* Controls */}
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={refresh}
          style={{
            background: '#007bff',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '5px',
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          🔄 Refresh Notifications
        </button>
      </div>

      {/* Detailed Lists */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        
        {/* Bell Notifications */}
        <div>
          <h3>🔔 Bell Notifications ({bellNotifications.length})</h3>
          <div style={{ 
            maxHeight: '400px', 
            overflowY: 'auto', 
            border: '1px solid #ddd', 
            borderRadius: '8px',
            background: 'white'
          }}>
            {bellNotifications.length === 0 ? (
              <p style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                No bell notifications found
              </p>
            ) : (
              bellNotifications.map((notification) => (
                <div
                  key={notification._id}
                  style={{
                    padding: '12px',
                    borderBottom: '1px solid #f0f0f0',
                    backgroundColor: notification.read ? 'white' : '#fff3e0'
                  }}
                >
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-start' 
                  }}>
                    <div style={{ flex: 1 }}>
                      <h5 style={{ 
                        margin: '0 0 4px 0', 
                        fontSize: '14px',
                        fontWeight: notification.read ? '500' : '600'
                      }}>
                        {notification.title}
                      </h5>
                      <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#666' }}>
                        {notification.message}
                      </p>
                      <div style={{ fontSize: '11px', color: '#999' }}>
                        <span style={{ 
                          background: '#ff5722', 
                          color: 'white', 
                          padding: '2px 6px', 
                          borderRadius: '4px',
                          marginRight: '8px'
                        }}>
                          {notification.type}
                        </span>
                        {new Date(notification.createdAt).toLocaleString()}
                      </div>
                    </div>
                    {!notification.read && (
                      <span style={{
                        background: '#ff5722',
                        color: 'white',
                        padding: '2px 6px',
                        borderRadius: '10px',
                        fontSize: '10px',
                        marginLeft: '8px'
                      }}>
                        NEW
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Notifications */}
        <div>
          <h3>💬 Chat Notifications ({chatNotifications.length})</h3>
          <div style={{ 
            maxHeight: '400px', 
            overflowY: 'auto', 
            border: '1px solid #ddd', 
            borderRadius: '8px',
            background: 'white'
          }}>
            {chatNotifications.length === 0 ? (
              <p style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                No chat notifications found
              </p>
            ) : (
              chatNotifications.map((notification) => (
                <div
                  key={notification._id}
                  style={{
                    padding: '12px',
                    borderBottom: '1px solid #f0f0f0',
                    backgroundColor: notification.read ? 'white' : '#e8f5e8'
                  }}
                >
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-start' 
                  }}>
                    <div style={{ flex: 1 }}>
                      <h5 style={{ 
                        margin: '0 0 4px 0', 
                        fontSize: '14px',
                        fontWeight: notification.read ? '500' : '600'
                      }}>
                        {notification.title}
                      </h5>
                      <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#666' }}>
                        {notification.message}
                      </p>
                      <div style={{ fontSize: '11px', color: '#999' }}>
                        <span style={{ 
                          background: '#4caf50', 
                          color: 'white', 
                          padding: '2px 6px', 
                          borderRadius: '4px',
                          marginRight: '8px'
                        }}>
                          {notification.type}
                        </span>
                        {new Date(notification.createdAt).toLocaleString()}
                      </div>
                    </div>
                    {!notification.read && (
                      <span style={{
                        background: '#4caf50',
                        color: 'white',
                        padding: '2px 6px',
                        borderRadius: '10px',
                        fontSize: '10px',
                        marginLeft: '8px'
                      }}>
                        NEW
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div style={{ 
        marginTop: '30px', 
        padding: '20px', 
        background: '#fff8e1', 
        borderRadius: '8px',
        border: '1px solid #ffc107'
      }}>
        <h3>📋 How the Filtering Works:</h3>
        <ul>
          <li><strong>🔔 Bell Icon:</strong> Shows notifications of type BID_WON, BID_ENDED, NEW_OFFER, BID_CREATED</li>
          <li><strong>💬 Chat Icon:</strong> Shows notifications of type CHAT_CREATED</li>
          <li><strong>Database Source:</strong> All notifications come from your database</li>
          <li><strong>Real-time Updates:</strong> The Header component combines these with socket notifications</li>
        </ul>
        
        <h3>🧪 Testing:</h3>
        <ol>
          <li>Check that the counts here match the badge numbers in your header</li>
          <li>Create some test notifications in your database</li>
          <li>Click &quot;Refresh Notifications&quot; to update the data</li>
          <li>Verify that the right types appear in the right sections</li>
        </ol>
      </div>
    </div>
  );
} 