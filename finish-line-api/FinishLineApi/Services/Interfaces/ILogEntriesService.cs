using FinishLineApi.Dto;
using System;
using System.Collections.Generic;

namespace FinishLineApi.Services
{
    public interface ILogEntriesService
    {
        IEnumerable<LogEntryDto> ReadAllItems(DateTime? date);
        LogEntryDto ReadItem(int id);
        LogEntryDto CreateItem(LogEntryDto newLogEntry);
        LogEntryDto UpdateItem(LogEntryDto newLogEntry);
        void DeleteItem(int id);
    }
}
