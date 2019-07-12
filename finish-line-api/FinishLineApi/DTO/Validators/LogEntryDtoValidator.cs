using FinishLineApi.Dto;
using FluentValidation;

namespace FinishLineApi.DTO.Validators
{
    public class LogEntryDtoValidator : AbstractValidator<LogEntryDto>
    {
        public LogEntryDtoValidator()
        {
            RuleSet("Create", () => {
                RuleFor(x => x.Title)
                    .NotNull()
                    .Length(1, 255);
                RuleFor(x => x.Content)
                    .NotNull()
                    .Length(0, 4096);
            });

            RuleSet("Update", () =>
            {
                RuleFor(x => x.Id)
                    .GreaterThan(0);
                RuleFor(x => x.Title)
                    .NotNull()
                    .Length(1, 255);
                RuleFor(x => x.Content)
                    .NotNull()
                    .Length(0, 4096);
                RuleFor(x => x.CreatedDate)
                    .NotNull();
            });
        }
    }
}
