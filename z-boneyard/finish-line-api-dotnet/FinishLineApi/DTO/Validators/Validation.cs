using FluentValidation;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace FinishLineApi.DTO.Validators
{
    internal static class Validation<ValidatorType, DtoType>
        where ValidatorType : AbstractValidator<DtoType>, new()
    {
        /// <summary>
        ///     Validates a DTO
        /// </summary>
        /// 
        /// <param name="item">
        ///     The DTO you want to validate
        /// </param>
        /// <param name="ruleSet">
        ///     A comma-separated list of rule sets.  If this parameter is NULL, then the default ruls set will be executed, only.
        /// </param>
        /// <example>
        ///     "*" executes all rules
        ///     "default" executes only the default rule set.
        ///     "default,RuleSet1,RuleSet2"
        /// </example>
        public static void ValidateObject(DtoType item, string ruleSet = null)
            
        {
            ValidatorType validator = new ValidatorType();
            var results = validator.Validate(item, ruleSet: ruleSet);
            if (!results.IsValid)
            {
                throw new ContentValidationException(results);
            }
        }
    }
}
