const stripResponseMetadata = (resp) => {
    if(!resp) throw new Error('SDK response is empty or undefined!');        
    if(resp['$metadata']) delete resp['$metadata'];
    if(resp.creationDateTime) delete resp.creationDateTime;
    if(resp.lastUpdatedDateTime) delete resp.lastUpdatedDateTime;
    if(resp.botAliasHistoryEvents) delete resp.botAliasHistoryEvents;
    if(resp.startDate) delete resp.startDate;
    if(resp.lastBuildSubmittedDateTime) delete resp.lastBuildSubmittedDateTime;        
    if(resp.botLocaleHistoryEvents) delete resp.botLocaleHistoryEvents;
    return resp;     
}

exports.stripResponseMetadata = stripResponseMetadata;
