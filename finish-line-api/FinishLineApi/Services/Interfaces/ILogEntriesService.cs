using FinishLineApi.Dto;
using System;
using System.Collections.Generic;

namespace FinishLineApi.Services.Interfaces
{
    public interface ILogEntriesService
    {
        IEnumerable<LogEntryDto> ReadAll(DateTime? date);
    }
}
