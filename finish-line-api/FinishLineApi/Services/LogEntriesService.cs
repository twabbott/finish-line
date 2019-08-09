using AutoMapper;
using FinishLineApi.Dto;
using FinishLineApi.DTO.Validators;
using FinishLineApi.Store.Contexts;
using FinishLineApi.Store.Entities;
using FluentValidation;
using System;
using System.Collections.Generic;
using System.Linq;

namespace FinishLineApi.Services
{
    public interface ILogEntriesService
    {
        IEnumerable<LogEntryDto> ReadAllItems(DateTime? date = null);
        LogEntryDto ReadItem(int id);
        LogEntryDto CreateItem(LogEntryDto newLogEntry);
        LogEntryDto UpdateItem(LogEntryDto newLogEntry);
        void DeleteItem(int id);
    }

    public class LogEntriesService: ILogEntriesService
    {
        private IFinishLineDBContext _dbContext;
        private IMapper _mapper;

        public LogEntriesService(IFinishLineDBContext dbContext, IMapper mapper)
        {
            _dbContext = dbContext;
            _mapper = mapper;
        }

        public IEnumerable<LogEntryDto> ReadAllItems(DateTime? date = null)
        {
            var query = _dbContext.LogEntries as IQueryable<LogEntry>;
            if (date.HasValue)
            {
                query = query.Where(item => item.CreatedDate.Date == date.Value.Date);
            }

            var results = query.ToList();

            return _mapper.Map<IEnumerable<LogEntryDto>>(results);
        }

        public LogEntryDto ReadItem(int id)
        {
            var query = _dbContext.LogEntries.Where(item => item.Id == id);
            var result = query.ToList().SingleOrDefault();
            return _mapper.Map<LogEntryDto>(result);
        }

        public LogEntryDto CreateItem(LogEntryDto entry)
        {
            entry.Id = 0;
            if (entry.Content == null)
            {
                entry.Content = "";
            }

            Validation<LogEntryDtoValidator, LogEntryDto>.ValidateObject(entry);

            entry.Title = entry.Title.Trim();
            entry.Content = entry.Content.Trim();

            var entity = _mapper.Map<LogEntry>(entry);
            entity.CreatedDate = DateTime.Now;
            _dbContext.LogEntries.Add(entity);
            _dbContext.CommitChanges();

            return _mapper.Map<LogEntryDto>(entity);
        }

        public LogEntryDto UpdateItem(LogEntryDto newEntry)
        {
            Validation<LogEntryDtoValidator, LogEntryDto>.ValidateObject(newEntry, "default,Update");

            LogEntry entry = _dbContext.LogEntries.FirstOrDefault(item => item.Id == newEntry.Id);
            if (entry == null)
            {
                throw new NotFoundException($"Item with id={newEntry.Id} not found.");
            }

            entry.ProjectId = newEntry.ProjectId;
            entry.WorkItemId = newEntry.WorkItemId;
            entry.Title = newEntry.Title.Trim();
            entry.Content = (newEntry.Content ?? "").Trim();

            if (!_dbContext.CommitChanges())
            {
                throw new NotFoundException($"Item with id={newEntry.Id} not updated.");
            }

            return _mapper.Map<LogEntryDto>(entry);
        }

        public void DeleteItem(int id)
        {
            LogEntry entry = _dbContext.LogEntries.FirstOrDefault(item => item.Id == id);
            if (entry == null)
            {
                throw new NotFoundException($"Item with id={id} not found.");
            }

            _dbContext.Remove(entry);

            if (!_dbContext.CommitChanges())
            {
                throw new NotFoundException($"Item with id={id} not found.");
            }
        }
    }
}
