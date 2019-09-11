using AutoMapper;
using FinishLineApi.Dto;
using FinishLineApi.DTO.Validators;
using FinishLineApi.Store.Contexts;
using FinishLineApi.Store.Entities;
using FinishLineApi.Store.Repositories;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace FinishLineApi.Services
{
    public interface IWorkNoteService
    {
        Task<IEnumerable<WorkNoteDto>> ReadAllItemsAsync(DateTime? date = null);
        Task<WorkNoteDto> ReadItemAsync(int id);
        Task<WorkNoteDto> CreateItemAsync(WorkNoteDto entry);
        Task<WorkNoteDto> UpdateItemAsync(WorkNoteDto newEntry);
        System.Threading.Tasks.Task DeleteItemAsync(int id);
    }

    public class WorkNoteService: IWorkNoteService
    {
        private IGenericRepository<WorkNote> _repository;
        private IMapper _mapper;

        public WorkNoteService(IGenericRepository<WorkNote> repository, IMapper mapper)
        {
            _repository = repository;
            _mapper = mapper;
        }

        public async Task<IEnumerable<WorkNoteDto>> ReadAllItemsAsync(DateTime? date = null)
        {
            IQueryable<WorkNote> query = _repository.All;
            if (date.HasValue)
            {
                query = query.Where(item => item.CreatedDate.Date == date.Value.Date);
            }

            var results = await query.ToListAsync();

            return _mapper.Map<IEnumerable<WorkNoteDto>>(results);
        }

        public async Task<WorkNoteDto> ReadItemAsync(int id)
        {
            WorkNote result = await _repository.GetByIdAsync(id);
            return _mapper.Map<WorkNoteDto>(result);
        }

        public async Task<WorkNoteDto> CreateItemAsync(WorkNoteDto entry)
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

            await _repository.CreateAsync(entity);

            return _mapper.Map<WorkNoteDto>(entity);
        }

        public async Task<WorkNoteDto> UpdateItemAsync(WorkNoteDto newEntry)
        {
            Validation<WorkNoteDtoValidator, WorkNoteDto>.ValidateObject(newEntry, "default,Update");

            WorkNote entry = _repository.All.FirstOrDefault(item => item.Id == newEntry.Id);
            if (entry == null)
            {
                throw new NotFoundException($"Item with id={newEntry.Id} not found.");
            }

            entry.ProjectId = newEntry.ProjectId;
            entry.WorkItemId = newEntry.WorkItemId;
            entry.Title = newEntry.Title.Trim();
            entry.Content = (newEntry.Content ?? "").Trim();

            await _repository.UpdateAsync(entry);

            return _mapper.Map<WorkNoteDto>(entry);
        }

        public async System.Threading.Tasks.Task DeleteItemAsync(int id)
        {
            await _repository.DeleteAsync(id);
        }
    }
}
