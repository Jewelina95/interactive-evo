"""Replace website data with one MarioEval English case archive."""
import argparse
from collections import Counter
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import shutil
from statistics import mean, median
import zipfile

ROOT = Path(__file__).resolve().parent.parent
LEVELS = [f'L{i}' for i in range(1, 7)]
NAMES = ['Goal preservation', 'Information uptake', 'State progression',
         'Contextual expression', 'Proactive agency', 'Long-horizon coherence']


def write_json(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2, allow_nan=False) + '\n', encoding='utf-8')


def numeric(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool)


def average(values):
    valid = [value for value in values if numeric(value)]
    return mean(valid) if valid else None


def summarize(record):
    scene, admin, outcome = record['scene'], record['administration'], record['outcome']
    evaluations = record['evaluation_record']
    first, last = evaluations[0]['engagement'], evaluations[-1]['engagement']
    facets = scene['facets']
    movements = [item['event_chain']['present'].get('present_moved') for item in evaluations]
    movements = [int(value) for value in movements if isinstance(value, bool)]
    red_line_turns = outcome['red_line_turns']
    difference = lambda key: last[key] - first[key] if numeric(first.get(key)) and numeric(last.get(key)) else None
    return {
        'id': record['case_id'], 'schema_version': record['schema_version'],
        'scene_id': scene['scene_id'],
        'realism': {'science-fictional': 'sci_fi'}.get(facets['realism'], facets['realism']),
        'information': facets['information'],
        'purpose': {'nonfunctional': 'non_functional'}.get(facets['purpose'], facets['purpose']),
        'assistant': admin['assistant_system'], 'partner': admin['user_system'],
        'terminal': outcome['ending'], 'assistant_turns': outcome['evaluated_turns'],
        'composite': outcome['composite'],
        'capability_level_means': [outcome['level_means'][level] for level in LEVELS],
        'stage_means': outcome['stage_means'], 'red_line_turns': red_line_turns,
        'red_line_turn_rate': red_line_turns / len(evaluations),
        'state_movement_rate': average(movements),
        'user_interest_start': first.get('user_interest'),
        'user_interest_end': last.get('user_interest'),
        'user_interest_change': difference('user_interest'),
        'tolerance_start': first.get('tolerance'), 'tolerance_end': last.get('tolerance'),
        'tolerance_change': difference('tolerance'),
        'persona': scene['persona'], 'objective': scene['objective'],
        'initial_situation': scene['initial_situation'],
    }


def model_summary(name, cases):
    successes = [case for case in cases if case['terminal'] == 'successful closure']
    return {
        'assistant': name, 'case_count': len(cases),
        'mean_composite': mean(case['composite'] for case in cases),
        'median_composite': median(case['composite'] for case in cases),
        'min_composite': min(case['composite'] for case in cases),
        'max_composite': max(case['composite'] for case in cases),
        'successful_closure_rate': len(successes) / len(cases),
        'interest_exhaustion_rate': sum(case['terminal'] == 'exhaustion of interest' for case in cases) / len(cases),
        'red_line_case_rate': sum(case['red_line_turns'] > 0 for case in cases) / len(cases),
        'median_assistant_turns': median(case['assistant_turns'] for case in cases),
        'median_successful_turns': median(case['assistant_turns'] for case in successes) if successes else None,
        'median_user_interest_change': median(case['user_interest_change'] for case in cases if numeric(case['user_interest_change'])),
        'mean_state_movement_rate': average([case['state_movement_rate'] for case in cases]),
        'mean_red_line_turn_rate': average([case['red_line_turn_rate'] for case in cases]),
        'scenario_count': len({case['scene_id'] for case in cases}),
        'capability_level_means': [mean(case['capability_level_means'][i] for case in cases) for i in range(6)],
        'capability_level_names': NAMES,
        **{field + '_counts': dict(Counter(case[field] for case in cases)) for field in ['realism', 'information', 'purpose']},
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('archive', type=Path)
    args = parser.parse_args()
    source = args.archive.resolve(strict=True)
    incoming = []
    with zipfile.ZipFile(source) as archive:
        for name in sorted(archive.namelist()):
            if not name.endswith('.json'):
                continue
            content = archive.read(name)
            record = json.loads(content)
            case_id = record['case_id']
            if Path(name).name != case_id + '.json' or not case_id.startswith('case_') or not case_id[5:].isdigit():
                raise ValueError('Invalid case filename')
            if record['schema_version'] != 'interacteval-main_v3/2026-10' or not record['evaluation_record']:
                raise ValueError('Unsupported or incomplete case schema')
            if record['outcome']['ending'] not in ['successful closure', 'exhaustion of interest']:
                raise ValueError('Unrecognized current-schema ending')
            incoming.append((record, content))
    if not incoming or len({record['case_id'] for record, _ in incoming}) != len(incoming):
        raise ValueError('Empty archive or duplicate case IDs')
    cases = [summarize(record) for record, _ in incoming]
    names = sorted({case['assistant'] for case in cases})
    models = [model_summary(name, [case for case in cases if case['assistant'] == name]) for name in names]
    target = (ROOT / 'data').resolve()
    if target.parent != ROOT.resolve() or target.name != 'data':
        raise ValueError('Data replacement target is outside the website directory')
    if target.exists():
        shutil.rmtree(target)
    (target / 'cases').mkdir(parents=True)
    for record, content in incoming:
        (target / 'cases' / (record['case_id'] + '.json')).write_bytes(content)
    write_json(target / 'cases.json', cases)
    write_json(target / 'models.json', models)
    manifest = {
        'source': source.name, 'source_sha256': hashlib.sha256(source.read_bytes()).hexdigest(),
        'schema_version': incoming[0][0]['schema_version'], 'language': 'en',
        'imported_at': datetime.now(timezone.utc).isoformat(),
        'case_count': len(cases), 'model_count': len(models),
        'scene_count': len({case['scene_id'] for case in cases}),
        'scenario_cells': len({(case['realism'], case['information'], case['purpose']) for case in cases}),
        'evaluated_turns': sum(len(record['evaluation_record']) for record, _ in incoming),
        'transcript_messages': sum(len(record['transcript']) for record, _ in incoming),
        'complete_interest_pairs': sum(numeric(case['user_interest_change']) for case in cases),
        'outcomes': dict(Counter(case['terminal'] for case in cases)),
        'red_line_cases': sum(case['red_line_turns'] > 0 for case in cases),
        'capability_level_names': NAMES,
        'score_source': 'outcome.composite and outcome.level_means (current cascaded scores)',
        'cases': {record['case_id']: hashlib.sha256(content).hexdigest() for record, content in incoming},
    }
    write_json(target / 'manifest.json', manifest)
    print(json.dumps({key: value for key, value in manifest.items() if key != 'cases'}))


if __name__ == '__main__':
    main()
