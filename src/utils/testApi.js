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
//       ,[TrainingTitle]
//       ,[TrainingType]
//       ,[TrainingMode]
//       ,[DocRef]
//       ,[Department]
//       ,[Trainer]
//       ,[ScheduledDate]
//       ,[ConductedDate]
//       ,[Venue]
//       ,[DurationHours]
//       ,[EvaluationMethod]
//       ,[PassCriteria]
//       ,[Effectiveness]
//       ,[Remarks]
//       ,[CreatedBy]
//       ,[CreatedAt]
//       ,[UpdatedBy]
//       ,[UpdatedAt]
//       ,[ClosedAt]
//   FROM [FINAMANQMS].[qms].[Training]


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

