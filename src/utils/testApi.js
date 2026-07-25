const { authenticateUser, fetchSidebarMenu } = require('./api.js');

const testApi = async () => {
    try {
        const authResponse = await authenticateUser();
        console.log('Authentication Successful:', authResponse);
        
        const token = authResponse.token;
        const menuResponse = await fetchSidebarMenu(token);
        console.log('Sidebar Menu:', menuResponse);
    } catch (error) {
        console.error('API Test Error:', error);
    }
};

testApi();


// SELECT TOP (1000) [Id]
//       ,[RecordNo]
//       ,[Status]
//       ,[StpNo]
//       ,[Title]
//       ,[Department]
//       ,[Category]
//       ,[Version]
//       ,[IssueDate]
//       ,[EffectiveDate]
//       ,[NextReviewDate]
//       ,[Supersedes]
//       ,[ReasonForRevision]
//       ,[ChangeRef]
//       ,[PreparedBy]
//       ,[ReviewedBy]
//       ,[ApprovedBy]
//       ,[TrainingDone]
//       ,[Distribution]
//       ,[Scope]
//       ,[CreatedBy]
//       ,[CreatedAt]
//       ,[UpdatedBy]
//       ,[UpdatedAt]
//       ,[ClosedAt]
//   FROM [FINAMANQMS].[qms].[STP]

// SELECT TOP (1000) [Id]
//       ,[RecordNo]
//       ,[Status]
//       ,[MonitoringDate]
//       ,[Area]
//       ,[Location]
//       ,[Grade]
//       ,[MonitoringType]
//       ,[Result]
//       ,[Unit]
//       ,[AlertLimit]
//       ,[ActionLimit]
//       ,[LimitStatus]
//       ,[Method]
//       ,[Analyst]
//       ,[ReviewedBy]
//       ,[ActionTaken]
//       ,[CapaRef]
//       ,[CreatedBy]
//       ,[CreatedAt]
//       ,[UpdatedBy]
//       ,[UpdatedAt]
//       ,[ClosedAt]
//   FROM [FINAMANQMS].[qms].[EnvMonitoring]



// SELECT TOP (1000) [Id]
//       ,[RecordNo]
//       ,[Status]
//       ,[AuditType]
//       ,[Agency]
//       ,[AreaDepartment]
//       ,[StartDate]
//       ,[EndDate]
//       ,[AuditScope]
//       ,[Auditors]
//       ,[AuditeeReps]
//       ,[CriticalObs]
//       ,[MajorObs]
//       ,[MinorObs]
//       ,[KeyFindings]
//       ,[ResponseSubmittedDate]
//       ,[ResponseDueDate]
//       ,[CapaRef]
//       ,[ComplianceStatus]
//       ,[CreatedBy]
//       ,[CreatedAt]
//       ,[UpdatedBy]
//       ,[UpdatedAt]
//       ,[ClosedAt]
//   FROM [FINAMANQMS].[qms].[Audit]


