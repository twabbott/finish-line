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
    public interface IWorkNoteService
    {
        IEnumerable<WorkNoteDto> ReadAllItems(DateTime? date = null);
        WorkNoteDto ReadItem(int id);
        WorkNoteDto CreateItem(WorkNoteDto newWorkNote);
        WorkNoteDto UpdateItem(WorkNoteDto newWorkNote);
        void DeleteItem(int id);
    }

    public class WorkNoteService: IWorkNoteService
    {
        private IFinishLineDBContext _dbContext;
        private IMapper _mapper;

        public WorkNoteService(IFinishLineDBContext dbContext, IMapper mapper)
        {
            _dbContext = dbContext;
            _mapper = mapper;
        }

        public IEnumerable<WorkNoteDto> ReadAllItems(DateTime? date = null)
        {
            var query = _dbContext.WorkNotes as IQueryable<WorkNote>;
            if (date.HasValue)
            {
                query = query.Where(item => item.CreatedDate.Date == date.Value.Date);
            }

            var results = query.ToList();

            return _mapper.Map<IEnumerable<WorkNoteDto>>(results);
        }

        public WorkNoteDto ReadItem(int id)
        {
            var query = _dbContext.WorkNotes.Where(item => item.Id == id);
            var result = query.ToList().SingleOrDefault();
            return _mapper.Map<WorkNoteDto>(result);
        }

        public WorkNoteDto CreateItem(WorkNoteDto entry)
        {
            entry.Id = 0;
            if (entry.Content == null)
            {
                entry.Content = "";
            }

            Validation<WorkNoteDtoValidator, WorkNoteDto>.ValidateObject(entry);

            entry.Title = entry.Title.Trim();
            entry.Content = entry.Content.Trim();

            var entity = _mapper.Map<WorkNote>(entry);
            entity.CreatedDate = DateTime.Now;
            _dbContext.WorkNotes.Add(entity);
            _dbContext.CommitChanges();

            return _mapper.Map<WorkNoteDto>(entity);
        }

        public WorkNoteDto UpdateItem(WorkNoteDto newEntry)
        {
            Validation<WorkNoteDtoValidator, WorkNoteDto>.ValidateObject(newEntry, "default,Update");

            WorkNote entry = _dbContext.WorkNotes.FirstOrDefault(item => item.Id == newEntry.Id);
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

            return _mapper.Map<WorkNoteDto>(entry);
        }

        public void DeleteItem(int id)
        {
            WorkNote entry = _dbContext.WorkNotes.FirstOrDefault(item => item.Id == id);
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
