using System;
using FinishLineApi.Dto;
using FluentValidation;
using FluentValidation.AspNetCore;
using Microsoft.AspNetCore.Mvc.ModelBinding;

namespace FinishLineApi.DTO.Validators
{
    public class LogEntryDtoValidator : AbstractValidator<LogEntryDto>
    {
        public LogEntryDtoValidator()
        {
            RuleSet("Update", () =>
            {
                RuleFor(x => x.Id)
                    .GreaterThan(0);
                RuleFor(x => x.CreatedDate)
                    .NotEmpty();
            });

            RuleFor(x => x.Title)
                .NotEmpty()
                .Length(1, 255);
            RuleFor(x => x.Content)
                .NotNull()
                .Length(0, 4096);
        }
    }
}
